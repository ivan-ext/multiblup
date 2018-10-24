node('master') {
	checkout scm

	sh "git checkout --detach" +
		" && git fetch --force origin '+refs/heads/*:refs/heads/*'" +
		" && git pull --force" +
		" && git checkout --force '${BRANCH_NAME}'" +
		" && git checkout --force origin/master -- continuous"

	load 'continuous/jenkins/main.Jenkinsfile'
}
