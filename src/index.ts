import { getInput, setOutput, exportVariable } from '@actions/core'
import { context, getOctokit } from "@actions/github"
import { Octokit } from "@octokit/core"

import config from 'dotenv'

main()
    .catch(err => console.error(err))

async function main(): Promise<void> {
    const githubApiKey = getInput("github-token") || process.env.GITHUB_TOKEN
    const repository = getInput('repository') || process.env.GITHUB_REPOSITORY
    const path = getInput('path') || '.env.production'

    const octokit = getOctokit(githubApiKey)
    
    console.log(`looking up DotEnv file at "${path}" in repository "${repository}"`)

    const file = await getFile(octokit, repository, path, context.ref || undefined)
    
    if(file) {
        const dotenv = config.parse(file)

        if(dotenv) {
            console.log(`setting output and env for ${Object.keys(dotenv).join(', ')}`)

            for(const [key, value] of Object.entries(dotenv)) {
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
