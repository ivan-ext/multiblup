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
	const htmlBuffer = q('#buffer')
	const htmlList = q('#list')
	const baseParam = new URL(document.URL).searchParams.get(BASE_PARAM_NAME)

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

		for (let i = 0; i < buildsResults.length; ++i) {
			forEachJob(buffer, jobsResults[i], buildsResults[i])
		}
	} catch (e) {
		failTo(buffer, e) // NOTE use String(Object.keys(e)) and String(Object.keys(e)) to get object's props
	} finally {
		moveContents(buffer, dest)
	}
}

async function getJobs(baseUrl: string): Promise<IJenkinsJobs> {
	const url = `${baseUrl}/api/json`
	return (await q.getJSON(url, {})) as IJenkinsJobs
}

async function getJob(baseUrl: string, jobName: string): Promise<IJenkinsJob> {
	const url = `${baseUrl}/job/${jobName}/api/json`
	return (await q.getJSON(url, {})) as IJenkinsJob
}

async function getBuild(baseUrl: string, jobName: string): Promise<IJenkinsBuild> {
	const url = `${baseUrl}/job/${jobName}/lastBuild/api/json`
	return (await q.getJSON(url, {})) as IJenkinsBuild
}

function forEachJob(dest: JQuery<HTMLElement>, job: IJenkinsJob, build: IJenkinsBuild): void {
	const then = build.timestamp
	const now = new Date().getTime()
	const ago = getReadableAgo(now - then)

	let result
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

	const description = padEnd(build.description, 7)
	const buildNumber = padEnd(build.number, 4)
	const additionalCssClass = result === 'building' ? 'animated' : ''
	const effect =
		result === 'building'
			? `<div class="bounce1"></div>` + `<div class="bounce2"></div>` + `<div class="bounce3"></div>`
			: ''

	const jobNameShorted = shorten(String(decodeURIComponent(job.name)))

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
	const max = 40
	const cutTo = max - 3
	const length = text.length

	if (length > max) {
		return text.substring(0, cutTo / 2) + '&hellip;' + text.substring(length - cutTo / 2)
	} else {
		return text
	}
}

function getReadableAgo(timestamp: number): string {
	let rest = timestamp / 1000
	const seconds = Math.floor(rest)
	rest = rest / 60
	const minutes = Math.floor(rest)
	rest = rest / 60
	const hours = Math.floor(rest)
	rest = rest / 24
	const days = Math.floor(rest)
	rest = rest / 30
	const months = Math.floor(rest)

	let amount
	let unit
	let opacity = '1'

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
	const d = new Date(timestamp)
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
