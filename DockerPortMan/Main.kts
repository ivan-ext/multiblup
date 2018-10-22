import java.io.*
import java.nio.channels.*
import java.nio.file.*

if (args.size != 2) {
	throw Error("Need exactly two args")
}

val fileName: String = args[0]
val branch: String = args[1]

val file: Path = Paths.get(fileName)

val options: Array<StandardOpenOption> = arrayOf(
		StandardOpenOption.READ, StandardOpenOption.CREATE,
		StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING)

FileChannel.open(file, *options).use { channel ->
	var lock: FileLock? = null
	try {
		lock = channel.lock()
	} finally {
		lock?.release()
	}
}

System.out.println("Kotlin rules? ${1 > 0}")
