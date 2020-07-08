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
const access_token = fs.readFileSync('secrets/github_access_token.txt', 'utf8').split("\n")[0];
const octokit = new Octokit({
    auth : access_token
});
const options = {owner : "leanprover-community", repo : "lean"};
const out_dir = "./dist"
const branch = "widget"

async function * getAllActionsRuns() {
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

async function getFromRelease(options) {
    const {owner, repo, tag} = options;
    const release = tag ? (await octokit.repos.getReleaseByTag({owner, repo, tag})) : (await octokit.repos.getLatestRelease({owner, repo}));
    console.log(`Found release ${release.data.name}`);
    const assets = release.data.assets;
    const asset = assets.find(x => x.name.endsWith("--browser.zip"));
    if (!asset) {
        throw new Error("Failed to find browser asset from these:", assets);
    }
    const id = asset.id;
    // const url = await octokit.repos.getReleaseAsset()
    const url = asset.browser_download_url;
    // curl -u my_client_id:my_client_secret

    if (!fs.existsSync(out_dir)) {
        await fs.promises.mkdir(out_dir);
    }
    const shell_file = path.join(out_dir, "shell.zip");

    await sh(`curl -L -u ${user}:${access_token} -o ${shell_file} "${url}"`);
    const items = [
        "lean_js_js.js",
        "lean_js_wasm.js",
        "lean_js_wasm.wasm"
    ];
    for (let item of items) {
        const input_ext = path.join("build", "shell", item)
        const out_file = path.join(out_dir, "shell", item);
        // -o = overwrite files without giving a prompt.
        await sh(`unzip -p -o ${shell_file} ${input_ext} > ${out_file}`);
    }

    console.log("Done")
}

async function getFromActionsArtifact() {
    const branch_resp = await octokit.repos.getBranch({...options, branch});
    const head_sha = branch_resp.data.commit.sha;
    console.log(`Branch: ${branch}`);
    console.log(`SHA: ${head_sha}`);
    console.log(`Message: ${branch_resp.data.commit.commit.message}`);
    let run_id;
    for await (let run of getAllActionsRuns()) {
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
    if (!artifact_url) {
        console.log("no artefact found, github sometimes deletes artifacts so try running the action again.");
        return;
    }
    if (!fs.existsSync(out_dir)) {
        await fs.promises.mkdir(out_dir);
    }
    const shell_file = path.join(out_dir, "shell.zip");

    await sh(`curl -v -L -u ${user}:${access_token} -o ${shell_file} "${artifact_url}/zip"`);
    console.log(`Downloaded to ${shell_file}`);

    const items = [
        "lean_js_js.js",
        "lean_js_wasm.js",
        "lean_js_wasm.wasm"
    ];
    for (let item of items) {
        const out_file = path.join(out_dir, item);
        // -o = overwrite files without giving a prompt.
        await sh(`unzip -o ${shell_file} ${item} -d ${out_dir}`);
    }

    console.log("Done");
}

getFromRelease(options);