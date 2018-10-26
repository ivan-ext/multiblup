try {
	stage('Prepare') {
		// TODO increment container port offset globally somehow !@#!
		jenkinsHost     = getJenkinsHost()
		containerOffset = (env.BRANCH_NAME == 'master' ? 1 : 2)
		containerPort   = 11000 + (containerOffset as Integer)
		imageBase       = sh returnStdout:true, script:"continuous/scripts/fix-name.sh '${BRANCH_NAME}'"
		imageTagVerbose = sh returnStdout:true, script:'continuous/scripts/get-git-string.sh master'
		imageTag        = sh returnStdout:true, script:"continuous/scripts/fix-name.sh '${imageTagVerbose}'"

		currentBuild.displayName += " @${imageTagVerbose}"
		currentBuild.description = imageTagVerbose
		echo "Build label set to: ${currentBuild.displayName}"
	}
	stage('Container Kill') {
		if (fileExists('continuous/docker/docker-compose.yml')) {
			header('Killing old container')
			doGradle("dockerTryRemove")
		} else {
			header('Old compose file not found, assuming initial build')
		}
	}
	stage('Clean') {
		header('Doing Gradle clean')
		doGradle("clean")
	}
	stage('Build') {
		header('Doing Gradle build')
		sh "continuous/scripts/process-all-templates.sh '${imageBase}' '${imageTag}' '' '${containerPort}'"
		doGradle("build -PjenkinsBuild='${imageBase}:${imageTagVerbose}'")
	}
	stage('Container Start') {
		header('Starting new container')
		doGradle("dockerStartNew -PjenkinsBuild='${imageBase}:${imageTagVerbose}'")
	}
	stage('Alive Check') {
		try {
			header('Checking web service for availability')
			timeout(time:10, unit:'SECONDS') {
				sh "continuous/scripts/wait-for-network-port-to-appear.sh '${containerPort}'"
			}
			sh "continuous/scripts/require-web-service-contains.sh " +
					"'http://${jenkinsHost}:${containerPort}/build.txt' '${imageTagVerbose}'"
		} finally {
			doGradle("dockerLogs")
		}
	}
} finally {
	header('Docker Info')
	sh 'continuous/scripts/print-docker-info.sh'
}

def doGradle(String params) {
	ansiColor('xterm') {
		sh "./gradlew --console plain -PjenkinsBuild='${containerOffset}' ${params}"
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
