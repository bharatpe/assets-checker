const core = require("@actions/core");
const github = require("@actions/github");
const exec = require("@actions/exec");
const { Octokit } = require("@octokit/rest");

const main = async () => {
  try {

    const inputs = {
      token: core.getInput("token"),
      target_folder: core.getInput("target_folder"),
      thrashold_size: core.getInput("thrashold_size")
    };

    const {
      payload: { pull_request: pullRequest, repository },
    } = github.context;

    if (!pullRequest) {
      core.error("This action only works on pull_request events");
      return;
    }

    const { number: issueNumber } = pullRequest;
    const { full_name: repoFullName } = repository;
    const [owner, repo] = repoFullName.split("/");

    const octokit = new Octokit({
      auth: inputs.token,
    });


    let myOutput = '';
    let myError = '';
    const options = {};

    options.listeners = {
      stdout: (data) => {
        myOutput += data.toString();
      },
      stderr: (data) => {
        myError += data.toString();
      }
    };

    await exec.exec(`find ${inputs.target_folder} \( -iname '*.gif' -o -iname '*.jpg' -o -iname '*.svg' -o -iname '*.jpeg' -o -iname '*.png' \) -type f -size +${inputs.thrashold_size}k -exec ls -lh {} \;`, null, options);

    const arrayOutput = myOutput.split("\n");
    const count = arrayOutput.length -1;

    const successBody = ` Woohooo :rocket: !!! Congratulations, your all assets are less than ${inputs.thrashold_size}Kb.`
    const errorBody = `Oops :eyes: !!! You have ${count} assets with size more than ${inputs.thrashold_size}Kb. Please optimize them.`


    if(count > 0) {
      octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body: errorBody,
      });
      core.setFailed('Invalid size assets exists !!!');
    }else {
      octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body: successBody,
      });
    }

    const out = await exec.exec(`find ${inputs.target_folder} \( -iname '*.gif' -o -iname '*.jpg' -o -iname '*.svg' -o -iname '*.jpeg' -o -iname '*.png' \) -type f -size +10k -exec ls -lh {} \;`);
    console.log(out);
    

    const coverage = `|Files Type|New Stats|Old Stats|Differences (New - Old)|
|-----|:-----:|:-----:|:-----:|
|test1|test2|test3|test4|
|test1|test2|test3|test41|
|test1|test2|test3|test42|
|test1|test2|test3|test42|
`;

    octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: coverage,
    });

  } catch (error) {
    core.setFailed(error.message);
  }
};

main();
