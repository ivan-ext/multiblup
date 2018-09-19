// These interfaces were extracted empirically from Jenkins' JSON responses.
// Unused properties are typed "any".

interface IJenkinsJobs {
	// ----- Typed ------------------------------------------------------------
	jobs: IJenkinsJobReference[]
	// ----- Untyped ----------------------------------------------------------
	_class: any
	assignedLabels: any
	description: any
	mode: any
	nodeDescription: any
	nodeName: any
	numExecutors: any
	overallLoad: any
	primaryView: any
	quietingDown: any
	slaveAgentPort: any
	unlabeledLoad: any
	useCrumbs: any
	useSecurity: any
	views: any
}

interface IJenkinsJobReference {
	_class: any
	color: string
	name: string
	url: string
}

interface IJenkinsBuildReference {
	_class: any
	number: number
	url: string
}

interface IJenkinsJob {
	// ----- Typed ------------------------------------------------------------
	buildable: boolean
	builds: IJenkinsBuildReference[]
	color: string
	concurrentBuild: boolean
	description: string
	displayName: string
	fullDisplayName: string
	fullName: string
	inQueue: boolean
	keepDependencies: boolean
	lastBuild?: IJenkinsBuildReference
	lastCompletedBuild?: IJenkinsBuildReference
	lastFailedBuild?: IJenkinsBuildReference
	lastStableBuild?: IJenkinsBuildReference
	lastSuccessfulBuild?: IJenkinsBuildReference
	lastUnstableBuild?: IJenkinsBuildReference
	lastUnsuccessfulBuild?: IJenkinsBuildReference
	name: string
	nextBuildNumber: number
	resumeBlocked: boolean
	url: string
	// ----- Untyped ----------------------------------------------------------
	_class: any
	actions: any
	displayNameOrNull: any
	firstBuild: any
	healthReport: any
	property: any
	queueItem: any
}

interface IJenkinsBuild {
	// ----- Typed ------------------------------------------------------------
	building: boolean
	description: string
	displayName: string
	duration: number
	fullDisplayName: string
	id: number
	number: number
	result: string
	timestamp: number
	// ----- Untyped ----------------------------------------------------------
	_class: any
	actions: any[]
	artifacts: any[]
	changeSets: any[]
	culprits: any[]
	estimatedDuration: any
	executor: any
	keepLog: any
	nextBuild: any
	previousBuild: any
	queueId: any
	url: any
}

interface IJenkinsPipelineBuild {
	// TODO look up in AWS jenkins
}

interface IJenkinsBuildWrapped {
	job: IJenkinsJob
	build: IJenkinsBuild
}
