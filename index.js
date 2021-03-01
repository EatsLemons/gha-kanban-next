const core = require('@actions/core')
const github = require('@actions/github')
const { Octokit } = require("@octokit/rest");

//const payload = JSON.stringify(github.context.payload, undefined, 2)
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
 * TODO
 *  exit if something not found
 *  
 * 
 */

const run = async () => {
    const token = core.getInput("OCTOKIT_TOKEN")

    const GH = new MyGithub(new Octokit({ auth: token }))

    const payload = JSON.stringify(github.context.payload, undefined, 2)

    console.log(123, payload)

    if (payload.issue == null || payload.issue == undefined)
        throw "payload issue not found"

    var firstColumn = await GH.getColumnId("EatsLemons", "gha-test", "test", "open")
    var secondColumn = await GH.getColumnId("EatsLemons", "gha-test", "test", "edit")

    var cardId = await findCardId(GH, firstColumn, payload.issue)

    await GH.moveCardTo(secondColumn.id, cardId)

    console.log(cardList)
}

async function findCardId(GH, column, issue) {
    var cardList = await GH.cardsList(column.id)

    return cardList.filter(x => x.content_url === issue.url)[0].id
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
            position: to
        })
    }

    this.cardsList = async (columnId) => {
        return (await this.octokit.projects.listCards({
            column_id: columnId
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