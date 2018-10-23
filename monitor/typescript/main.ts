import * as q from 'jquery'

// ====================================================================================================================
// Globals
// ====================================================================================================================
const REFRESH_DELAY_IN_MILLIS: number = 2000
const NBSP: string = '\xa0' // non-breaking space

const baseUrl: string = getParam('base')
const linkSuffix: string = getParam('suffix')

// ====================================================================================================================
// Entrypoint
// ====================================================================================================================
// main loop
q(document).ready(() => main())

// ====================================================================================================================
// Enums
// ====================================================================================================================
enum Result { // string values are used by .css
	GOOD = 'good',
	BAD = 'bad',
	IN_PROGRESS = 'in-progress',
	UNKNOWN = 'unknown'
}

// ====================================================================================================================
// Functions
// ====================================================================================================================
function getParam(name: string): string {
	const temp: string | null = new URL(document.URL).searchParams.get(name)
	if (temp == null || temp === '') {
		alert(`Request parameter required: ${name}`)
		return ''
	} else {
		return temp
	}
}

function main(): void {
	const htmlBuffer: JQuery<HTMLElement> = q('#buffer')
	const htmlList: JQuery<HTMLElement> = q('#list')

	mainLoop(htmlList, htmlBuffer).then(() => setTimeout(main, REFRESH_DELAY_IN_MILLIS))
}

async function mainLoop(dest: JQuery<HTMLElement>, buffer: JQuery<HTMLElement>): Promise<void> {
	try {
		const allJobs: IJenkinsJobs = await getJobs()

		const jobsPromises: Array<Promise<IJenkinsJob>> = allJobs.jobs.map(j => {
			return getJob(j.name)
		})
		const jobsResults: IJenkinsJob[] = await Promise.all(jobsPromises)

		const buildsPromises: Array<Promise<IJenkinsBuild>> = jobsResults.map(j => {
			return getBuild(j.name)
		})
		const buildsResults: IJenkinsBuild[] = await Promise.all(buildsPromises)

		const pipelinePromises: Array<Promise<IJenkinsPipeline>> = jobsResults.map(j => {
			return getPipeline(j.name)
		})
		const pipelineResults: IJenkinsPipeline[] = await Promise.all(pipelinePromises)

		for (let i: number = 0; i < jobsResults.length; ++i) {
			forEachJob(buffer, jobsResults[i], buildsResults[i], pipelineResults[i])
		}
	} catch (e) {
		/* Javascript returns here an object with following properties:
			readyState,getResponseHeader,getAllResponseHeaders,setRequestHeader,overrideMimeType,
			statusCode,abort,state,always,catch,pipe,then,promise,progress,done,fail,responseJSON,
			status,statusText */
		failTo(buffer, e.statusText)
	} finally {
		moveContentsIfDiffer(buffer, dest)
	}
}

async function getJobs(): Promise<IJenkinsJobs> {
	const url: string = `${baseUrl}/api/json`
	return (await q.getJSON(url, {})) as IJenkinsJobs
}

async function getJob(jobName: string): Promise<IJenkinsJob> {
	const url: string = `${baseUrl}/job/${jobName}/api/json`
	return (await q.getJSON(url, {})) as IJenkinsJob
}

async function getBuild(jobName: string): Promise<IJenkinsBuild> {
	const url: string = `${baseUrl}/job/${jobName}/lastBuild/api/json`
	return (await q.getJSON(url, {})) as IJenkinsBuild
}

async function getPipeline(jobName: string): Promise<IJenkinsPipeline> {
	const url: string = `${baseUrl}/job/${jobName}/lastBuild/wfapi`
	return (await q.getJSON(url, {})) as IJenkinsPipeline
}

function forEachJob(dest: JQuery<HTMLElement>, job: IJenkinsJob, build: IJenkinsBuild, pipe: IJenkinsPipeline): void {
	const then: number = build.timestamp
	const now: number = new Date().getTime()
	const ago: string = getReadableAgo(now - then)

	let result: Result
	switch (build.result) {
		case 'SUCCESS':
			result = Result.GOOD
			break
		case 'FAILURE':
			result = Result.BAD
			break
		default:
			result = build.building ? Result.IN_PROGRESS : Result.UNKNOWN
	}

	let stage: string | null = null
	if (result === Result.BAD || (build.building && pipe.stages.length > 0)) {
		// break after the FIRST failed stage is encountered
		for (let i: number = 0; i < pipe.stages.length; ++i) {
			stage = `${i}: ${pipe.stages[i].name}`
			if (pipe.stages[i].status === 'FAILED') {
				break
			}
		}
	}

	const additionalCssClass: string = result === Result.IN_PROGRESS ? 'animated' : ''
	const effect: string =
		result === Result.IN_PROGRESS
			? `<div class="bounce1"></div>` + `<div class="bounce2"></div>` + `<div class="bounce3"></div>`
			: ''

	const jobNameShorted: string = shorten(String(decodeURIComponent(job.name)))
	const splitBuildDescription: string[] = build.description.split('/')
	const commitNumber: string = emptyIfNull(splitBuildDescription[0])
	const versionString: string = emptyIfNull(splitBuildDescription[1])
	const ticketNumber: string = emptyIfNull(splitBuildDescription[2])
	const webPort: string = emptyIfNull(splitBuildDescription[3])
	const webLink: string = `http://${new URL(document.URL).hostname}:${webPort}/${linkSuffix}`

	const dockerNet: boolean = true
	const dockerDb: boolean = true
	const dockerWeb: boolean = false

	let appendStatusHtml: string = `<div class="subline">#${build.number} &nbsp; ${ago}</div>`

	if (stage != null) {
		appendStatusHtml += `<div class="subline">${stage}</div>`
	}

	dest.append(
		`<div class="entry line ${result} ${additionalCssClass}">
			<div class="spinner">${effect}</div>
			<div class="e1"><a href="${webLink}">${jobNameShorted}</a></div>
			<div class="e2">#${ticketNumber}</div>
			<div class="e3">
			<div class="subline">${versionString}</div>
				<div class="subline">@${commitNumber}</div>
			</div>
			<div class="e4">${appendStatusHtml}</div>
			<div class="e5">
				<div class="dockerline">${grayIfFalse(dockerNet, 'N')}</div>
				<div class="dockerline">${grayIfFalse(dockerDb, 'D')}</div>
				<div class="dockerline">${grayIfFalse(dockerWeb, 'W')}</div>
			</div>
		</div>`
	)
}

function grayIfFalse(state: boolean, letter: string): string {
	const clazz: string = state ? 'dockerGood' : 'dockerBad'
	return `<span class="${clazz}">${letter}</span>`
}

function shorten(text: string): string {
	const max: number = 40
	const cutTo: number = max - 3
	const length: number = text.length

	if (length > max) {
		return text.substring(0, cutTo / 2) + '&hellip;' + text.substring(length - cutTo / 2)
	} else {
		return text
	}
}

function getReadableAgo(timestamp: number): string {
	let rest: number = timestamp / 1000 / 60 // 1000: millis, 60: seconds

	const minutes: number = Math.floor(rest)
	rest = rest / 60
	const hours: number = Math.floor(rest)
	rest = rest / 24
	const days: number = Math.floor(rest)
	rest = rest / 30
	const months: number = Math.floor(rest)

	let amount: number
	let unit: string
	let opacity: string = '1'

	if (months > 1) {
		amount = months
		unit = 'months'
		opacity = '0.25'
	} else if (days > 1) {
		amount = days
		unit = 'days'
		opacity = '0.5'
	} else if (hours > 1) {
		amount = hours
		unit = 'hours'
		opacity = '0.75'
	} else if (minutes > 1) {
		amount = minutes
		unit = 'minutes'
		opacity = '1'
	} else {
		return `<span style='opacity:${opacity}'>current</span>`
	}

	return `<span style='opacity:${opacity}'>${amount} ${unit} ago</span>`
}

function failTo(dest: JQuery<HTMLElement>, info: string): void {
	dest.append(`<div class='pageerror'>!@#! ${info} !@#!</div>`)
}

function moveContentsIfDiffer(source: JQuery<HTMLElement>, dest: JQuery<HTMLElement>): void {
	if (source.html() !== dest.html()) {
		dest.empty()
		source
			.children()
			.clone()
			.appendTo(dest)
	}

	source.empty()
}

function emptyIfNull(text: string | null): string {
	return text == null ? '' : text
}

// ====================================================================================================================
// TODO Not used
// ====================================================================================================================
function failItemTo(dest: JQuery<HTMLElement>, info: string): void {
	dest.append(`<div class="entry jsonerror"><div>!@#! ${info} !@#!</div></div>`)
}

function getReadableDate(timestamp: number): string {
	const d: Date = new Date(timestamp)
	return (
		d.getFullYear() +
		'/' +
		padZeros(1 + d.getMonth()) +
		'/' +
		padZeros(d.getDate()) +
		' ' +
		padZeros(d.getHours()) +
		':' +
		padZeros(d.getMinutes())
	)
}

function padZeros(obj: any): string {
	return String(obj).padStart(2, '0')
}

function padStart(text: any, num: number): string {
	return String(text).padStart(num, NBSP)
}

function padEnd(text: any, num: number): string {
	return String(text).padEnd(num, NBSP)
}
