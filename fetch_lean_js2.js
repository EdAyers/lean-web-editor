#! /usr/bin/node
const { Octokit } = require("@octokit/rest")
const fs = require("fs");
const path = require("path");
const http = require("http");
const util = require("util");
const exec = util.promisify(require('child_process').exec);
const sh = async (cmd) => {
    console.log(`> ${cmd}`);
    let {stdout, stderr } = await exec(cmd);
    console.log(stdout);
    console.error(stderr);
}

/* Get your access token:
https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line */
const user = "EdAyers"
const access_token = fs.readFileSync('secrets/github_access_token.txt', 'utf8');
const octokit = new Octokit({
    auth : access_token
});
const options = {owner : "EdAyers", repo : "lean"};
const out_dir = "./dist"
const branch = "widget"

async function * getAllRuns() {
    console.log("Getting workflow runs");
    let response = await octokit.actions.listRepoWorkflowRuns({
        ...options,
        branch
    });
    const total_count = response.data.total_count;
    console.log(`Found ${total_count} runs`);
    yield * response.data.workflow_runs;
    let link = response.headers.link;
    while (link) {
        debugger;
    }
}

async function run() {
    const branch_resp = await octokit.repos.getBranch({...options, branch});
    const head_sha = branch_resp.data.commit.sha;
    console.log(`Branch: ${branch}`);
    console.log(`SHA: ${head_sha}`);
    console.log(`Message: ${branch_resp.data.commit.commit.message}`);
    let run_id;
    for await (let run of getAllRuns()) {
       if (run.head_sha === head_sha) {
         console.log(`Using run ${run.url}`);
         run_id = run.id;
         break;
       }
    }
    let artifacts = await octokit.actions.listWorkflowRunArtifacts({...options, run_id});
    let artifact_id;
    let artifact_url;
    for (let a of artifacts.data.artifacts) {
        if (a.name === "shell") {
            artifact_id = a.id;
            artifact_url = a.url;
            console.log(`Using artifact ${a.url}`);
            break;
        }
    }
    if (!fs.existsSync(out_dir)) {
        await fs.promises.mkdir(out_dir);
    }
    const shell_file = path.join(out_dir, "shell.zip");

    await sh(`curl -v -L -u ${user}:${access_token} -o ${shell_file} "${artifact_url}/zip"`);
    console.log(`Downloaded to ${shell_file}`);

    // [note] I couldn't get this to work so I just exed shell commands instead.
    // const shell_writer = fs.createWriteStream(shell_file);
    // let dl = await octokit.actions.downloadArtifact({...options, artifact_id, archive_format : "zip"});
    // console.log(`Downloading from ${dl.url}`);
    // let stream;
    // await new Promise((resolve, reject) => {
    //     http.request({
    //         url : dl.url,
    //         method : "GET",
    //         encoding : null,
    //     }, resp => {
    //         console.log(`Saving to ${shell_file}`);
    //         resp.pipe(shell_writer).on("end", resolve);
    //     });
    // });
    // console.log(`Saved`)

    const items = [
        "lean_js_js.js",
        "lean_js_wasm.js",
        "lean_js_wasm.wasm"
    ];
    for (let item of items) {
        const out_file = path.join(out_dir, item);
        await sh(`unzip -u ${shell_file} ${item} -d ${out_dir}`);
    }

    console.log("Making library");



    console.log("Done");
}

run();