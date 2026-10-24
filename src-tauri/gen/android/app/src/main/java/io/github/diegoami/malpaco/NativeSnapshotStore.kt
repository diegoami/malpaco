package io.github.diegoami.malpaco

import android.content.Context
import android.util.AtomicFile
import android.util.JsonReader
import android.util.JsonToken
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileNotFoundException
import java.io.IOException
import java.io.StringReader
import java.nio.ByteBuffer
import java.nio.CharBuffer
import java.nio.charset.CharacterCodingException
import java.nio.charset.CodingErrorAction

/** One opaque namespace image, at fixed app-private paths. Not a WebView capability. */
internal class NativeSnapshotStore(
  context: Context,
  private val beforeCommit: ((Slot) -> Unit)? = null,
) {
  enum class Slot { CURRENT, PREVIOUS, RECOVERY }
  enum class Error { INVALID, UNSUPPORTED, TOO_LARGE, IO, RECOVERY_OCCUPIED }
  sealed class Read {
    object Missing : Read()
    data class Snapshot(val json: String, val recovered: Boolean = false) : Read()
    data class Failed(val error: Error) : Read()
  }
  sealed class Write {
    object Saved : Write()
    data class Failed(val error: Error) : Write()
  }
  companion object {
    // All instances in this application process share AtomicFile's required lock.
    private val lock = Any()
    private const val maxBytes = 16 * 1024 * 1024
  }
  private val directory = File(context.filesDir, "malpaco-snapshots")
  private val files = mapOf(
    Slot.CURRENT to AtomicFile(File(directory, "current.json")),
    Slot.PREVIOUS to AtomicFile(File(directory, "previous.json")),
    Slot.RECOVERY to AtomicFile(File(directory, "recovery.bin")),
  )
  private class Rejected(val reason: Error) : Exception()
  private data class Candidate(val bytes: ByteArray? = null, val json: String? = null, val error: Error? = null)

  fun read(): Read = synchronized(lock) {
    val current = inspect(Slot.CURRENT)
    if (current.json != null) return@synchronized Read.Snapshot(current.json)
    // A newer format is not corrupt data to downgrade or silently replace.
    if (current.error == Error.UNSUPPORTED) return@synchronized Read.Failed(Error.UNSUPPORTED)
    val previous = inspect(Slot.PREVIOUS)
    if (previous.json != null) return@synchronized Read.Snapshot(previous.json, recovered = true)
    if (current.error == null && previous.error == null) Read.Missing
    else Read.Failed(current.error ?: previous.error ?: Error.IO)
  }

  fun write(json: String): Write = synchronized(lock) {
    try {
      val bytes = encode(json)
      validate(json, bytes.size)
      val current = inspect(Slot.CURRENT)
      val previous = inspect(Slot.PREVIOUS)
      if (current.error == Error.UNSUPPORTED || previous.error == Error.UNSUPPORTED) throw Rejected(Error.UNSUPPORTED)
      if (current.error != null) preserve(current)
      if (current.json != null) {
        if (previous.error != null) preserve(previous)
        commit(Slot.PREVIOUS, current.bytes!!)
      }
      commit(Slot.CURRENT, bytes)
      Write.Saved
    } catch (error: Rejected) { Write.Failed(error.reason) }
      catch (_: IOException) { Write.Failed(Error.IO) }
      catch (_: SecurityException) { Write.Failed(Error.IO) }
  }

  /** Retain bad original bytes before replacing their fixed slot. Never overwrite another recovery. */
  private fun preserve(candidate: Candidate) {
    val bytes = candidate.bytes ?: throw Rejected(candidate.error ?: Error.IO)
    val existing = raw(Slot.RECOVERY)
    if (existing != null && !existing.contentEquals(bytes)) throw Rejected(Error.RECOVERY_OCCUPIED)
    if (existing == null) commit(Slot.RECOVERY, bytes)
  }

  private fun commit(slot: Slot, bytes: ByteArray) {
    val file = files.getValue(slot)
    val stream = file.startWrite()
    try {
      stream.write(bytes)
      beforeCommit?.invoke(slot)
      // AtomicFile can log commit errors instead of propagating them. Explicitly
      // detect sync failure and verify the committed image before reporting success.
      stream.fd.sync()
      file.finishWrite(stream)
    } catch (error: Throwable) {
      try { file.failWrite(stream) } catch (rollback: Throwable) { error.addSuppressed(rollback) }
      throw error
    }
    if (raw(slot)?.contentEquals(bytes) != true) throw IOException("Snapshot commit verification failed")
  }

  /** Read through AtomicFile so an abandoned staging file cannot replace the last good image. */
  private fun raw(slot: Slot): ByteArray? {
    val file = files.getValue(slot)
    val input = try { file.openRead() } catch (error: FileNotFoundException) {
      val base = file.baseFile
      if (base.exists() || File(base.path + ".bak").exists()) throw error
      // An incomplete first CURRENT image is not an empty store. The other slots
      // can safely retry staging while their source image is still intact.
      if (slot == Slot.CURRENT && File(base.path + ".new").exists()) throw error
      return null
    }
    return input.use {
      val output = ByteArrayOutputStream()
      val buffer = ByteArray(8192)
      while (true) {
        val count = it.read(buffer)
        if (count < 0) break
        if (output.size().toLong() + count > maxBytes) throw Rejected(Error.TOO_LARGE)
        output.write(buffer, 0, count)
      }
      output.toByteArray()
    }
  }

  private fun inspect(slot: Slot): Candidate {
    var bytes: ByteArray? = null
    return try {
      bytes = raw(slot) ?: return Candidate()
      val json = Charsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
        .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(bytes)).toString()
      validate(json, bytes.size)
      Candidate(bytes, json)
    } catch (error: Rejected) { Candidate(bytes, error = error.reason) }
      catch (_: CharacterCodingException) { Candidate(bytes, error = Error.INVALID) }
      catch (_: IOException) { Candidate(bytes, error = Error.IO) }
      catch (_: SecurityException) { Candidate(bytes, error = Error.IO) }
  }

  private fun encode(json: String): ByteArray {
    if (json.length > maxBytes) throw Rejected(Error.TOO_LARGE)
    val buffer = try {
      Charsets.UTF_8.newEncoder().onMalformedInput(CodingErrorAction.REPORT)
        .onUnmappableCharacter(CodingErrorAction.REPORT).encode(CharBuffer.wrap(json))
    } catch (_: CharacterCodingException) { throw Rejected(Error.INVALID) }
    if (buffer.remaining() > maxBytes) throw Rejected(Error.TOO_LARGE)
    return ByteArray(buffer.remaining()).also { buffer.get(it) }
  }

  /** JsonReader is strict; game record strings are deliberately never parsed or rewritten. */
  private fun validate(json: String, byteCount: Int) {
    if (byteCount > maxBytes) throw Rejected(Error.TOO_LARGE)
    try {
      JsonReader(StringReader(json)).use { reader ->
        reader.isLenient = false
        if (reader.peek() != JsonToken.BEGIN_OBJECT) throw Rejected(Error.INVALID)
        reader.beginObject()
        var version = false
        var entries = false
        while (reader.hasNext()) {
          when (reader.nextName()) {
            "version" -> {
              if (version || reader.peek() != JsonToken.NUMBER) throw Rejected(Error.INVALID)
              if (reader.nextString() != "1") throw Rejected(Error.UNSUPPORTED)
              version = true
            }
            "entries" -> {
              if (entries || reader.peek() != JsonToken.BEGIN_OBJECT) throw Rejected(Error.INVALID)
              entries = true
              reader.beginObject()
              val keys = HashSet<String>()
              while (reader.hasNext()) {
                val key = reader.nextName()
                if (!key.startsWith("malpaco:") || !keys.add(key) || reader.peek() != JsonToken.STRING) throw Rejected(Error.INVALID)
                reader.nextString()
              }
              reader.endObject()
            }
            else -> throw Rejected(Error.INVALID)
          }
        }
        reader.endObject()
        if (!version || !entries || reader.peek() != JsonToken.END_DOCUMENT) throw Rejected(Error.INVALID)
      }
    } catch (error: Rejected) { throw error }
      catch (_: IOException) { throw Rejected(Error.INVALID) }
      catch (_: IllegalStateException) { throw Rejected(Error.INVALID) }
  }
}
