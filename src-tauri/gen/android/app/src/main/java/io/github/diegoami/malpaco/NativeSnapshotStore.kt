package io.github.diegoami.malpaco

import android.content.Context
import java.io.File
import java.io.IOException

/** Direct-write behavioral baseline. Replaced after recording the durability regressions. */
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
  private val directory = File(context.filesDir, "malpaco-snapshots")
  private val current = File(directory, "current.json")

  fun read(): Read = try {
    if (current.exists()) Read.Snapshot(current.readText(Charsets.UTF_8)) else Read.Missing
  } catch (_: IOException) { Read.Failed(Error.IO) }

  fun write(json: String): Write = try {
    directory.mkdirs()
    current.writeText(json, Charsets.UTF_8)
    beforeCommit?.invoke(Slot.CURRENT)
    Write.Saved
  } catch (_: IOException) { Write.Failed(Error.IO) }
}
