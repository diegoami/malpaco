package io.github.diegoami.malpaco

import android.content.Context
import android.content.ContextWrapper
import android.util.AtomicFile
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import java.io.IOException
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class NativeSnapshotStoreTest {
  private lateinit var root: File
  private lateinit var context: Context
  private val dir get() = File(root, "malpaco-snapshots")
  private val current get() = File(dir, "current.json")
  private val previous get() = File(dir, "previous.json")
  private val recovery get() = File(dir, "recovery.bin")
  private fun image(id: String) = """{"version":1,"entries":{"malpaco:current-game":"$id","malpaco:current-game-meta":"$id","malpaco:scoreboard":"$id","malpaco:preferences":"$id","malpaco:next-game-settings":"$id","malpaco:card-position":"$id"}}"""
  private fun saved(result: NativeSnapshotStore.Write) = assertEquals(NativeSnapshotStore.Write.Saved, result)
  private fun snapshot(store: NativeSnapshotStore): NativeSnapshotStore.Read.Snapshot {
    val result = store.read()
    assertTrue("Expected a complete snapshot, got ${result.javaClass.simpleName}", result is NativeSnapshotStore.Read.Snapshot)
    return result as NativeSnapshotStore.Read.Snapshot
  }
  private fun failed(code: NativeSnapshotStore.Error, result: NativeSnapshotStore.Write) =
    assertEquals(NativeSnapshotStore.Write.Failed(code), result)

  @Before fun isolate() {
    val target = InstrumentationRegistry.getInstrumentation().targetContext
    root = File(target.cacheDir, "snapshot-tests-${UUID.randomUUID()}")
    assertTrue(root.mkdirs())
    context = object : ContextWrapper(target) { override fun getFilesDir(): File = root }
  }
  @After fun removeOnlyTestContext() { root.deleteRecursively() }

  @Test fun exactOpaqueBytesSurviveNewInstances() {
    val store = NativeSnapshotStore(context)
    assertEquals(NativeSnapshotStore.Read.Missing, store.read())
    val raw = """ {"version":1,"entries":{"malpaco:current-game":"{not game JSON","malpaco:current-game-meta":"{\"id\":\"Åland\"}","malpaco:seed-game:7":"future record 𐀀","malpaco:scoreboard":"line\nzero\u0000\ud800","malpaco:preferences":"{\"speed\":\"normal\"}","malpaco:next-game-settings":"{\"regions\":96}","malpaco:card-position":"{\"x\":4}"}} """
    saved(store.write(raw))
    assertEquals(raw, snapshot(NativeSnapshotStore(context)).json)
    assertArrayEquals(raw.toByteArray(Charsets.UTF_8), current.readBytes())
  }

  @Test fun malformedAndUnsupportedInputsPreserveGoodImage() {
    val store = NativeSnapshotStore(context)
    val good = image("kept")
    saved(store.write(good))
    val invalid = listOf("{broken", "{}", "{version:1,entries:{}}", """{"version":1,"entries":{"malpaco:x":3}}""", """{"version":1,"entries":{"outside":"x"}}""")
    for (raw in invalid) {
      failed(NativeSnapshotStore.Error.INVALID, store.write(raw))
      assertEquals(good, snapshot(NativeSnapshotStore(context)).json)
      assertArrayEquals(good.toByteArray(Charsets.UTF_8), current.readBytes())
    }
    failed(NativeSnapshotStore.Error.UNSUPPORTED, store.write("""{"version":2,"entries":{}}"""))
    assertEquals(good, snapshot(NativeSnapshotStore(context)).json)
  }

  @Test fun byteBoundRejectsLargeUnicodeBeforeReplacingGoodImage() {
    val store = NativeSnapshotStore(context)
    val good = image("kept")
    saved(store.write(good))
    // Fewer than16Mi characters, more than16Mi UTF-8 bytes.
    val raw = "{\"version\":1,\"entries\":{\"malpaco:large\":\"" + "€".repeat(6 * 1024 * 1024) + "\"}}"
    failed(NativeSnapshotStore.Error.TOO_LARGE, store.write(raw))
    assertEquals(good, snapshot(NativeSnapshotStore(context)).json)
  }

  @Test fun failureAfterWritingStagedBytesRetainsGoodImage() {
    val good = image("kept")
    saved(NativeSnapshotStore(context).write(good))
    val failing = NativeSnapshotStore(context) { slot -> if (slot == NativeSnapshotStore.Slot.CURRENT) throw IOException("injected write failure") }
    failed(NativeSnapshotStore.Error.IO, failing.write(image("uncommitted")))
    assertEquals(good, snapshot(NativeSnapshotStore(context)).json)
    assertArrayEquals(good.toByteArray(Charsets.UTF_8), current.readBytes())
  }

  @Test fun unfinishedPlatformAtomicWriteRecoversGoodImage() {
    val good = image("kept")
    saved(NativeSnapshotStore(context).write(good))
    val stream = AtomicFile(current).startWrite()
    stream.write("{incomplete".toByteArray())
    stream.fd.sync()
    // Simulate an abandoned writer: intentionally neither finishWrite nor failWrite.
    stream.close()
    assertEquals(good, snapshot(NativeSnapshotStore(context)).json)
    assertFalse(File(current.path + ".new").exists())
    assertFalse(File(current.path + ".bak").exists())
  }

  @Test fun interruptedFirstImageIsNotAnEmptyStore() {
    val partial = "{incomplete first image".toByteArray()
    val stream = AtomicFile(current).startWrite()
    stream.write(partial); stream.fd.sync(); stream.close()
    assertTrue("Do not bootstrap over an interrupted first snapshot", NativeSnapshotStore(context).read() is NativeSnapshotStore.Read.Failed)
    val staged = File(current.path + ".new")
    assertArrayEquals(partial, (if (staged.exists()) staged else current).readBytes())
  }

  @Test fun commitReadbackRejectsSilentFinishFailure() {
    val good = image("kept")
    saved(NativeSnapshotStore(context).write(good))
    val obstructed = NativeSnapshotStore(context) { slot ->
      if (slot == NativeSnapshotStore.Slot.CURRENT) {
        assertTrue(current.delete()); assertTrue(current.mkdir())
        File(current, "obstruction").writeText("retained")
      }
    }
    // AtomicFile logs the failed rename instead of throwing. The store must not
    // report success just because finishWrite returned; the previous image is usable.
    failed(NativeSnapshotStore.Error.IO, obstructed.write(image("uncommitted")))
    val loaded = snapshot(NativeSnapshotStore(context))
    assertTrue(loaded.recovered); assertEquals(good, loaded.json)
    assertEquals("retained", File(current, "obstruction").readText())
  }

  @Test fun priorImageRecoversAndMalformedOriginalIsRetainedBeforeRepair() {
    val store = NativeSnapshotStore(context)
    val a = image("A")
    val b = image("B")
    saved(store.write(a)); saved(store.write(b))
    val malformed = byteArrayOf(0x7b, 0xff.toByte(), 0x00)
    current.writeBytes(malformed)
    val loaded = snapshot(NativeSnapshotStore(context))
    assertTrue(loaded.recovered); assertEquals(a, loaded.json)
    saved(store.write(image("C")))
    assertArrayEquals(malformed, recovery.readBytes())
    assertEquals(image("C"), snapshot(NativeSnapshotStore(context)).json)
    val other = "{another broken image".toByteArray()
    current.writeBytes(other)
    failed(NativeSnapshotStore.Error.RECOVERY_OCCUPIED, store.write(image("D")))
    assertArrayEquals(other, current.readBytes())
    assertArrayEquals(malformed, recovery.readBytes())
    assertEquals(a, snapshot(NativeSnapshotStore(context)).json)
  }

  @Test fun futureStoredEnvelopeCannotBeSilentlyDowngraded() {
    val store = NativeSnapshotStore(context)
    saved(store.write(image("A"))); saved(store.write(image("B")))
    val future = """{"version":2,"entries":{"malpaco:current-game":"future"}}"""
    current.writeText(future)
    assertEquals(NativeSnapshotStore.Read.Failed(NativeSnapshotStore.Error.UNSUPPORTED), store.read())
    failed(NativeSnapshotStore.Error.UNSUPPORTED, store.write(image("C")))
    assertEquals(future, current.readText())
    assertEquals(image("A"), previous.readText())
  }

  @Test fun namespaceKeysAreDataAndCannotChoosePaths() {
    val marker = File(root, "untouched")
    marker.writeText("kept")
    val raw = """{"version":1,"entries":{"malpaco:../../untouched":"changed","malpaco:/absolute/path":"data"}}"""
    saved(NativeSnapshotStore(context).write(raw))
    assertEquals(raw, snapshot(NativeSnapshotStore(context)).json)
    assertEquals("kept", marker.readText())
    assertEquals(setOf("untouched", "malpaco-snapshots"), root.list()!!.toSet())
  }

  @Test fun independentInstancesSerializeReadersAndWriters() {
    saved(NativeSnapshotStore(context).write(image("start")))
    val pool = Executors.newFixedThreadPool(3)
    val firstStaged = CountDownLatch(1)
    val releaseFirst = CountDownLatch(1)
    val secondStarted = CountDownLatch(1)
    val secondStaged = CountDownLatch(1)
    val readerStarted = CountDownLatch(1)
    val a = NativeSnapshotStore(context) { slot ->
      if (slot == NativeSnapshotStore.Slot.CURRENT) { firstStaged.countDown(); assertTrue(releaseFirst.await(10, TimeUnit.SECONDS)) }
    }
    val b = NativeSnapshotStore(context) { slot -> if (slot == NativeSnapshotStore.Slot.CURRENT) secondStaged.countDown() }
    val first = pool.submit<NativeSnapshotStore.Write> { a.write(image("A")) }
    var second: java.util.concurrent.Future<NativeSnapshotStore.Write>? = null
    var reader: java.util.concurrent.Future<NativeSnapshotStore.Read>? = null
    try {
      assertTrue(firstStaged.await(5, TimeUnit.SECONDS))
      second = pool.submit<NativeSnapshotStore.Write> { secondStarted.countDown(); b.write(image("B")) }
      reader = pool.submit<NativeSnapshotStore.Read> { readerStarted.countDown(); NativeSnapshotStore(context).read() }
      assertTrue(secondStarted.await(5, TimeUnit.SECONDS)); assertTrue(readerStarted.await(5, TimeUnit.SECONDS))
      assertFalse("A second instance must not stage over an unfinished writer", secondStaged.await(200, TimeUnit.MILLISECONDS))
      assertFalse("A reader must not interrupt a staged write", reader.isDone)
      releaseFirst.countDown()
      saved(first.get(5, TimeUnit.SECONDS)); saved(second.get(5, TimeUnit.SECONDS))
      val complete = reader.get(5, TimeUnit.SECONDS) as NativeSnapshotStore.Read.Snapshot
      assertTrue(complete.json == image("A") || complete.json == image("B"))
      assertEquals(image("B"), snapshot(NativeSnapshotStore(context)).json)
      assertEquals(image("A"), previous.readText())
    } finally {
      releaseFirst.countDown()
      try { first.get(5, TimeUnit.SECONDS); second?.get(5, TimeUnit.SECONDS); reader?.get(5, TimeUnit.SECONDS) } finally { pool.shutdownNow() }
    }
  }
}
