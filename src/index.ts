import { getInput, setOutput, exportVariable } from '@actions/core'
import { context, getOctokit } from "@actions/github"
import { Octokit } from "@octokit/core"

import config from 'dotenv'
import { expand } from 'dotenv-expand'

main()
    .catch(err => console.error(err))

async function main(): Promise<void> {
    const githubApiKey = getInput("github-token") || process.env.GITHUB_TOKEN
    const repository = getInput('repository') || process.env.GITHUB_REPOSITORY
    const path = getInput('path') || '.env.production'
    const ignoredEnvs = String(getInput('ignore-env') || '').split(',').map(env => env.trim()).filter(env => env.length > 0)

    const octokit = getOctokit(githubApiKey)
    
    console.log(`looking up DotEnv file at "${path}" in repository "${repository}"`)

    const file = await getFile(octokit, repository, path, context.ref || undefined)
    
    if(file) {
        const dotenv = config.parse(file)
        const expanded = expand(dotenv)

        if(expanded) {
            console.log(`setting output and env for ${Object.keys(expanded).join(', ')}`)

            for(const [key, value] of Object.entries(expanded)) {
                if(ignoredEnvs.includes(key))
                    continue

                setOutput(key, value)
                exportVariable(key, value)
            }
        }
        else {
            console.log(`setting no output since nothing is parsed.`)
        }
    }
}

async function getFile(octokit: Octokit, repository: string, path: string, ref?: string) {
    const [, owner, repo] = /([^\/]+)\/(.*)/gi.exec(repository)
    const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', { 
        owner,
        repo,
        path,
        ref
    })

    if(response.status == 200) {
        if(typeof response.data == 'object' && 'type' in response.data && response.data.type == 'file') {
            return Buffer.from(response.data.content, 'base64').toString()
        }
    }

    return null
}
