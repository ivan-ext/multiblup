// ================================================================================================
// Definitions
// ================================================================================================
import java.io.*
import java.nio.charset.*
import org.gradle.internal.os.OperatingSystem.current as OS
import org.apache.commons.io.IOUtils as IO

buildscript {
    repositories { mavenLocal(); mavenCentral() }
    dependencies {
        classpath("commons-io:commons-io:2.6")
    }
}

plugins { base }

val osType = determineOsType()
val jenkinsBuild: String by project // got from cmd-line property: -PpropName=propValue

// ================================================================================================
// Tasks
// ================================================================================================
tasks {
    val internalDockerCleanTemp by registering(Delete::class)
    val internalDockerPrepareBuild by registering
    val internalDockerPrepareBuildCopy by registering(Copy::class)
    val internalDockerPrepareStart by registering
    val internalDockerInitDirs by registering
    val dockerConfig by registering
    val dockerBuild by registering
    val dockerStartNew by registering
    val dockerStart by registering
    val dockerStop by registering
    val dockerRemove by registering
    val dockerTryRemove by registering
    val dockerLogs by registering
    val dockerLogsFollow by registering
    val dockerStatus by registering

    project.defaultTasks(dockerStatus.name)

    internalDockerCleanTemp {
        delete("$projectDir/continuous/docker/db/.temp", "$projectDir/continuous/docker/web/.temp")
    }

    tasks ["clean"].dependsOn += internalDockerCleanTemp

    internalDockerInitDirs {
        doLast {
            mkdir("$projectDir/continuous/docker/db/.temp")
            mkdir("$projectDir/continuous/docker/web/.temp")
            mkdir("$projectDir/containers/1/shared")
            mkdir("$projectDir/containers/1/export")
            mkdir("$projectDir/containers/1/import")
            mkdir("$projectDir/containers/1/logs")
        }
    }

    internalDockerPrepareBuild {
        dependsOn += internalDockerPrepareBuildCopy

        doLast {
            overwriteFileWithText("$projectDir/continuous/docker/web/.temp/build.txt", jenkinsBuild)
        }
    }

    internalDockerPrepareBuildCopy {
        dependsOn += internalDockerInitDirs

        // dependsOn += "war"

//        into("$projectDir/docker")
//
//        from("$projectDir/build/libs/") {
//            include("*.war")
//            into("web/.temp/wars/")
//            rename { _ -> "aaa.war" } // we expect only one .war
//        }
//
//        from("$projectDir/src/main/resources/") {
//            include("JAAS.config")
//            into("web/.temp/others/")
//        }
//
//        from("$projectDir/doc/sql/mssql/latest/") {
//            include("*.sql")
//            into("db/.temp/")
//            rename { f ->
//                when {
//                    f.contains("create") -> "create.sql"
//                    f.contains("insert") -> "insert.sql"
//                    else -> f
//                }
//            }
//        }
//
//        from("$projectDir/doc/CustomerSpecific/BBB") {
//            include("*.sql")
//            into("db/.temp/")
//            rename { f ->
//                when {
//                    f.contains("insert_script") -> "customer-specific.sql"
//                    else -> f
//                }
//            }
//        }
    }

    internalDockerPrepareStart {
    }

    dockerBuild {
        dependsOn += internalDockerPrepareBuild
        // ensure, that this task is considered up-to-date, when the prepare task was up-to-date
        outputs.upToDateWhen { !internalDockerPrepareBuild.get().didWork }

        doLast { dockerCompose("build") }
    }

    dockerStartNew {
        dependsOn += dockerBuild
        dependsOn += internalDockerPrepareStart

        doLast {
            delete("$projectDir/containers/1/shared/db-is-ready.info")
            // overwriteFileWithText("$projectDir/continuous/docker/db/db.env", "AAA_DO_REUSE=no")
            dockerCompose("up", "--detach")
        }
    }

    dockerStart {
        dependsOn += dockerBuild
        dependsOn += internalDockerPrepareStart

        doLast {
            delete("$projectDir/containers/1/shared/db-is-ready.info")
            // overwriteFileWithText("$projectDir/continuous/docker/db/db.env", "AAA_DO_REUSE=yes")
            dockerCompose("up", "--detach")
        }
    }

    dockerConfig { doLast { dockerCompose("config") } }
    dockerStop { doLast { dockerCompose("down") } }
    dockerStatus { doLast { dockerCompose("top") } }
    dockerLogs { doLast { dockerCompose("logs") } }
    dockerLogsFollow { doLast { dockerCompose("logs", "--follow") } }

    dockerRemove { doLast { dockerCompose("down", "--rmi", "all") } }
    dockerTryRemove {
        doLast {
            try {
                dockerCompose("down", "--rmi", "all")
            } catch (e: Error) {
            }
        }
    }
}

// ================================================================================================
// Supplementary
// ================================================================================================
enum class OsType { LINUX, WINDOWS, BASH_ON_WINDOWS, UNKNOWN }

fun overwriteFileWithText(filename: String, text: String) {
    file(filename).writeText("### FILE GETS OVERWRITTEN !!!\n$text\n", StandardCharsets.UTF_8)
}

fun run(vararg args: String) {
    val prepend: Array<String> = when (osType) {
        OsType.LINUX -> arrayOf()
        OsType.BASH_ON_WINDOWS -> arrayOf()
        OsType.WINDOWS -> arrayOf("cmd.exe", "/c")
        else -> throw Error("Your OS is not supported (and stinks) - ${OS().familyName}")
    }

    runRaw(*prepend, *args)
}

fun dockerCompose(vararg args: String) {
    val prepend: Array<String> = when (osType) {
        OsType.LINUX -> arrayOf("docker-compose")
        OsType.BASH_ON_WINDOWS -> arrayOf("cmd.exe", "/v", "/c", "set", "TEST_VARIABLE=aaa&&", "docker-compose")
        OsType.WINDOWS -> arrayOf("docker-compose")
        else -> throw Error("Your OS is not supported (and stinks) - ${OS().familyName}")
    }

    runRaw(*prepend, "-f", "$projectDir/continuous/docker/docker-compose.yml", *args)
}

fun runRaw(vararg args: String) {
    runInternal(System.out, System.err, *args)
}

fun runRawToString(vararg args: String): String {
    val out = ByteArrayOutputStream()
    runInternal(out, System.err, *args)
    return String(out.toByteArray(), StandardCharsets.UTF_8)
}

fun runInternal(outDest: OutputStream, errDest: OutputStream, vararg args: String) {
    val builder = ProcessBuilder(args.toList())
    // FIXME Fails with Windows and Bash-under-Windows, I suppose because of cmd.exe
    builder.environment()["TEST_VARIABLE"] = "FROM-GRADLE"
    val process = builder.start()

    val outThread = Thread { IO.copy(process.inputStream, outDest) }
    val errThread = Thread { IO.copy(process.errorStream, errDest) }

    listOf(outThread, errThread).forEach { it.start() }
    val exitCode = process.waitFor()
    listOf(outThread, errThread).forEach { it.join() }

    if (exitCode != 0) {
        throw Error("Exit code was $exitCode, command: ${args.toList()}")
    }
}

fun determineOsType(): OsType {
    val family = OS().familyName
    return when (family) {
        "linux" -> if (isBashUnderWindows()) OsType.BASH_ON_WINDOWS else OsType.LINUX
        "windows" -> OsType.WINDOWS
        else -> OsType.UNKNOWN
    }
}

fun isBashUnderWindows(): Boolean {
    try {
        return OS().familyName == "linux"
                && runRawToString("cat", "/proc/version").contains("Microsoft")
    } catch (err: Error) {
        return false
    }
}

// ================================================================================================
// Misc Code Snippets
// ================================================================================================
// add plugin from non-root script
//		apply(plugin = "base")
//		apply(plugin = "java")
// check inputs|outputs of a task
//      println(" inputs: ${internalDockerPrepare.get().inputs.files.files}")
//      println("outputs: ${internalDockerPrepare.get().outputs.files.files}")
// failed shutdown hook attempt:
//      script begin --- val onShutdown by extra { AtomicReference<Runnable>() }
//      runInternal  --- onShutdown.set(Runnable { process.destroyForcibly() })
// failed attempts use configs and sourcesets
//      val kotlinConfig by configurations.creating
//      val kotlinSourceSet by sourceSets.creating
