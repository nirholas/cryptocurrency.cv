plugins {
    kotlin("jvm") version "1.9.22"
    application
}

group = "io.cryptocurrencycv"
version = "1.0.0"

repositories {
    mavenCentral()
}

dependencies {
    implementation("com.google.code.gson:gson:2.10.1")
    testImplementation(kotlin("test"))
}

application {
    mainClass.set("io.cryptocurrencycv.MainKt")
}

tasks.test {
    useJUnitPlatform()
}

kotlin {
    jvmToolchain(11)
}
