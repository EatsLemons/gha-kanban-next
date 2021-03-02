const core = require('@actions/core')
const github = require('@actions/github')
const { Octokit } = require("@octokit/rest");

/**
 * inputs
 *  github token
 *  owner
 *  repo
 *  project name
 *  labelname
 *  from column
 *  target column
 * 
 *  
 * 
 */

const run = async () => {
    const token = core.getInput("OCTOKIT_TOKEN")
    const owner = core.getInput("REPO_OWNER")
    const repo = core.getInput("REPO_NAME")
    const project = core.getInput("PROJECT")
    const from = core.getInput("COLUMN_FROM")
    const to = core.getInput("COLUMN_TO")
    const label = core.getInput("LABEL_NAME")

    const GH = new MyGithub(new Octokit({ auth: token }))

    const payload = github.context.payload

    console.log(234, payload.issue)

    if (payload.issue == null || payload.issue == undefined)
        throw "payload issue not found"

    var firstColumn = await GH.getColumnId(owner, repo, project, from)
    var secondColumn = await GH.getColumnId(owner, repo, project, to)

    var card = await findCardId(GH, firstColumn, payload.issue)
    if (card == undefined)
        return

    await GH.moveCardTo(secondColumn.id, card.id)
}

async function findCardId(GH, column, issue) {
    var cardList = await GH.cardsList(column.id)
    
    return cardList.find(x => x.content_url === issue.url)
}

try {
    run()
} catch (error) {
    core.setFailed(error.message);
}

function MyGithub (octokit) {
    this.octokit = octokit
    
    this.moveCardTo = async (to, cardId) => {
        await this.octokit.projects.moveCard({
            card_id: cardId,
            position: 'bottom',
            column_id: to
        })
    }

    this.cardsList = async (columnId) => {
        return (await this.octokit.projects.listCards({
            column_id: columnId.toString()
        })).data
    }

    this.getColumnId = async (owner, repo, projectName, columnName) => {
        const projectId = await this.getProjectId(owner, repo, projectName)

        const columns = await this.octokit.projects.listColumns({ project_id: projectId })

        const colId = columns.data.filter(x => x.name == columnName)[0]

        if (colId == null)
            throw new Error(`Column  ${columnName} was not found`)
        
        return colId
    }

    this.getProjectId = async (owner, repo, projectName) => {
        const projects = await this.octokit.projects.listForRepo({ repo: repo, owner: owner })

        const res = projects.data.filter(x => x.name == projectName)

        if (res == null)
            throw new Error(`Project ${projectName} was not found`)

        return res[0].id
    }
}
  

//console.log(`The event payload: ${payload}`);