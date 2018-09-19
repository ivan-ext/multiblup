// ================================================================================================
// "Soft" cleanup methods - remove stopped|unused stuff
// ================================================================================================
def dockerRemoveStopped() {
	sh "( docker ps --filter 'status=exited' | xargs docker rm --force ) || true"
}

def dockerPrune() {
	sh "docker system prune --force"
}

// ================================================================================================
// "Hard" cleanup methods - remove running|in-use stuff
// ================================================================================================
def dockerRemoveAll() {
	sh "( docker ps --all --quiet | xargs docker rm --force ) || true"
}

def dockerPruneAll() {
	sh "docker system prune --force --all --volumes"
}

// ================================================================================================
// "Hard" cleanup methods - remove running|in-use stuff
// ================================================================================================
def dockerCleanup() {
	dockerRemoveStopped()
	dockerPrune()
}

def dockerObliterate() {
	dockerRemoveAll()
	dockerPruneAll()
}

return this // exports methods to the caller pipeline
