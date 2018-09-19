pipeline {
	agent any
	options { disableConcurrentBuilds() }

	stages {
		stage('Prepare') {
			steps {
				script {
					sh "git checkout --detach " +
						"&& git fetch origin '+refs/heads/*:refs/heads/*' " +
						"&& git pull --force  " +
						"&& git checkout '${BRANCH_NAME}'"

					// TODO increment container port offset globally somehow !@#!
					jenkinsHost     = getJenkinsHost()
					containerOffset = (env.BRANCH_NAME == 'master' ? 1 : 2)
					containerPort   = 11000 + (containerOffset as Integer)
					imageBase       = sh returnStdout:true, script:"scripts/fix-name.sh '${BRANCH_NAME}'"
					imageTagVerbose = sh returnStdout:true, script:'scripts/get-git-string.sh master'
					imageTag        = sh returnStdout:true, script:"scripts/fix-name.sh '${imageTagVerbose}'"

					currentBuild.displayName += " @${imageTagVerbose}"
					currentBuild.description = imageTagVerbose
				}
				echo "Build label set to: ${currentBuild.displayName}"
			}
		}
		stage('Container Kill') {
			steps {
				script {
					if (fileExists('docker/docker-compose.yml')) {
						header('Killing old container')
						doGradle("dockerTryRemove")
					} else {
						header('Old compose file not found, assuming initial build')
					}
				}
			}
		}
		stage('Clean') {
			steps {
				header('Doing Gradle clean')
				doGradle("clean")
			}
		}
		stage('Build') {
			steps {
				header('Doing Gradle build')
				sh "scripts/process-all-templates.sh '${imageBase}' '${imageTag}' '' '${containerPort}'"
				doGradle("build -PjenkinsBuild='${imageBase}:${imageTagVerbose}'")
			}
		}
		stage('Container Start') {
			steps {
				header('Starting new container')
				doGradle("dockerStartNew -PjenkinsBuild='${imageBase}:${imageTagVerbose}'")
			}
		}
		stage('Alive Check') {
			steps {
				script {
					try {
						header('Checking web service for availability')
						timeout(time:10, unit:'SECONDS') {
							sh "scripts/wait-for-network-port-to-appear.sh '${containerPort}'"
						}
						sh "scripts/require-web-service-contains.sh " +
								"'http://${jenkinsHost}:${containerPort}/build.txt' '${imageTagVerbose}'"
					} finally {
						doGradle("dockerLogs")
					}
				}
			}
		}
	}
	post {
		always {
			header('Docker Info')
			sh 'scripts/print-docker-info.sh'
		}
	}
}

def doGradle(String params) {
	ansiColor('xterm') {
		sh "./gradlew --console plain -q -PthrowAwayOffset='${containerOffset}' ${params}"
	}
}

def header(String header) {
	String lines = '='.multiply(60 - header.length() / 2)
	echo "\n${lines}   ${header}   ${lines}"
}

def getJenkinsHost() {
	return env.JENKINS_URL.split('://')[1].split(':')[0]
}

// NOTE possible usefull snippets:
// environment { }
