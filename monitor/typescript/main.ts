import * as q from 'jquery'

// ================================================================================================
// Globals
// ================================================================================================
const REFRESH_DELAY_IN_MILLIS: number = 2000
const NBSP: string = '\xa0' // non-breaking space
const BASE_PARAM_NAME: string = 'base' // parameter defines base URL for Jenkins JSON API calls

// ================================================================================================
// Entrypoint
// ================================================================================================
// main loop
q(document).ready(() => main())

// ================================================================================================
// Functions
// ================================================================================================
function main(): void {
	const htmlBuffer: JQuery<HTMLElement> = q('#buffer')
	const htmlList: JQuery<HTMLElement> = q('#list')
	const baseParam: string | null = new URL(document.URL).searchParams.get(BASE_PARAM_NAME)

	if (baseParam == null) {
		failTo(htmlList, `Request parameter required: "?${BASE_PARAM_NAME}=..."`)
	} else {
		mainLoop(baseParam.trim(), htmlList, htmlBuffer).then(() => setTimeout(main, REFRESH_DELAY_IN_MILLIS))
	}
}

async function mainLoop(baseUrl: string, dest: JQuery<HTMLElement>, buffer: JQuery<HTMLElement>): Promise<void> {
	try {
		const allJobs: IJenkinsJobs = await getJobs(baseUrl)

		const jobsPromises: Array<Promise<IJenkinsJob>> = allJobs.jobs.map(j => {
			return getJob(baseUrl, j.name)
		})
		const jobsResults: IJenkinsJob[] = await Promise.all(jobsPromises)

		const buildsPromises: Array<Promise<IJenkinsBuild>> = jobsResults.map(j => {
			return getBuild(baseUrl, j.name)
		})
		const buildsResults: IJenkinsBuild[] = await Promise.all(buildsPromises)

		const pipelinePromises: Array<Promise<IJenkinsPipeline>> = jobsResults.map(j => {
			return getPipeline(baseUrl, j.name)
		})
		const pipelineResults: IJenkinsPipeline[] = await Promise.all(pipelinePromises)

		for (let i = 0; i < jobsResults.length; ++i) {
			forEachJob(buffer, jobsResults[i], buildsResults[i], pipelineResults[i])
		}
	} catch (e) {
		failTo(buffer, e) // NOTE use String(Object.keys(e)) and String(Object.keys(e)) to get object's props
	} finally {
		moveContents(buffer, dest)
	}
}

async function getJobs(baseUrl: string): Promise<IJenkinsJobs> {
	const url: string = `${baseUrl}/api/json`
	return (await q.getJSON(url, {})) as IJenkinsJobs
}

async function getJob(baseUrl: string, jobName: string): Promise<IJenkinsJob> {
	const url: string = `${baseUrl}/job/${jobName}/api/json`
	return (await q.getJSON(url, {})) as IJenkinsJob
}

async function getBuild(baseUrl: string, jobName: string): Promise<IJenkinsBuild> {
	const url: string = `${baseUrl}/job/${jobName}/lastBuild/api/json`
	return (await q.getJSON(url, {})) as IJenkinsBuild
}

async function getPipeline(baseUrl: string, jobName: string): Promise<IJenkinsPipeline> {
	const url: string = `${baseUrl}/job/${jobName}/lastBuild/wfapi`
	return (await q.getJSON(url, {})) as IJenkinsPipeline
}

function forEachJob(dest: JQuery<HTMLElement>, job: IJenkinsJob, build: IJenkinsBuild, pipe: IJenkinsPipeline): void {
	const then: number = build.timestamp
	const now: number = new Date().getTime()
	let ago: string

	if (build.building && pipe.stages.length > 0) {
		ago = pipe.stages.slice(-1)[0].name // get last element
	} else {
		ago = getReadableAgo(now - then)
	}

	let result: string
	switch (build.result) {
		case 'SUCCESS':
			result = 'good'
			break
		case 'FAILURE':
			result = 'bad'
			break
		default:
			result = build.building ? 'building' : 'undefined'
	}

	const description: string = padEnd(build.description, 7)
	const buildNumber: string = padEnd(build.number, 4)
	const additionalCssClass: string = result === 'building' ? 'animated' : ''
	const effect: string =
		result === 'building'
			? `<div class="bounce1"></div>` + `<div class="bounce2"></div>` + `<div class="bounce3"></div>`
			: ''

	const jobNameShorted: string = shorten(String(decodeURIComponent(job.name)))

	dest.append(
		`<div class="entry ${result} ${additionalCssClass}">
			<div class="spinner">${effect}</div>
			<div class="left">${jobNameShorted}</div>
			<div class="mid"><span class="description">&nbsp;@${description}</span>
			<span class="buildnumber">&nbsp;#${buildNumber}</span></div>
			<div class="right">${ago}</div>
		</div>`
	)
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
	let rest: number = timestamp / 1000
	const seconds: number = Math.floor(rest)
	rest = rest / 60
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
		return `<span style='opacity:${opacity}'>${padStart('recently', 11)}</span>`
	}

	return `<span style='opacity:${opacity}'>${padStart(amount, 3)} ${padEnd(unit, 7)}</span>`
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

function padStart(text: any, num: number): string {
	return String(text).padStart(num, NBSP)
}

function padEnd(text: any, num: number): string {
	return String(text).padEnd(num, NBSP)
}

function padZeros(obj: any): string {
	return String(obj).padStart(2, '0')
}

function failTo(dest: JQuery<HTMLElement>, info: string): void {
	dest.append(`<div class='pageerror'>!@#! ${info} !@#!</div>`)
}

function failItemTo(dest: JQuery<HTMLElement>, info: string): void {
	dest.append(`<div class="entry jsonerror"><div>!@#! ${info} !@#!</div></div>`)
}

function moveContents(source: JQuery<HTMLElement>, dest: JQuery<HTMLElement>): void {
	dest.empty()
	source
		.children()
		.clone()
		.appendTo(dest)
	source.empty()
}
