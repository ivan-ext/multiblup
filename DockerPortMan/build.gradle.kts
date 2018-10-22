import org.jetbrains.kotlin.gradle.tasks.*

plugins {
	kotlin("jvm") version "1.3.0-rc-190"
}

group = "my"
version = "1.0-SNAPSHOT"

repositories {
	mavenCentral()
}

dependencies {
	compile(kotlin("stdlib-jdk8"))
	compile(kotlin("scripting-jvm"))
}

tasks.withType<KotlinCompile> {
	kotlinOptions.jvmTarget = "1.8"
}
