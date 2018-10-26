node('master') {
	ciBranch = 'continuous'

	checkout scm

	sh "git checkout --detach" +
		" && git fetch --force origin '+refs/heads/*:refs/heads/*'" +
		" && git checkout --force '${BRANCH_NAME}'" +
		" && git reset --hard" +
		" && git clean -fd" +
		" && git checkout --force '${ciBranch}' -- continuous" // dest dir

	load 'continuous/jenkins/main.Jenkinsfile'
}
