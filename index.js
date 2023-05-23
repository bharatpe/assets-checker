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
    const ignoreArray = [];

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

    async function getAssetsIgnoreFiles() {
      const ignoreOptions = {};
      ignoreOptions.listeners = {
        stdout: (data) => {
          ignoreArray.push(data.toString());
        },
        stderr: (data) => {
          
        }
      };

      const file=`${inputs.target_folder}/.assets-ignore`;
      await exec.exec(`
        while read -r line; do
          echo "$line"
        done <"${file}"`
      , null, ignoreOptions);
    }
    
    // await getAssetsIgnoreFiles();

    await exec.exec(`find ${inputs.target_folder} -type f \( -name "*.jpeg" -o -name "*.png" -o -name "*.svg" -o -name "*.gif" -o -name "*.jpg" \) -size +${inputs.thrashold_size}k -exec ls -lh {} \;`, null, options);

    let arrayOutput = myOutput.split("\n");
    if (ignoreArray.length > 0) {
      arrayOutput = ignoreArray.filter (val => !arrayOutput.includes(val));
    }
    const count = arrayOutput.length -1;

    const invalidFiles = [...arrayOutput];

    const successBody = ` Woohooo :rocket: !!! Congratulations, your all assets are less than ${inputs.thrashold_size}Kb.`
    const errorBody = `Oops :eyes: !!! You have ${count} assets with size more than ${inputs.thrashold_size}Kb. Please optimize them.`

    const getTableDataString = (invalidFiles) => {
      let filteredFiles = [];

      for(let item of invalidFiles) {
        const fileName = item.split(" ").slice(-1).pop();
        const fileSize = item.split(" ")[4];
        if(fileName && fileSize) filteredFiles.push([fileName, fileSize]);
      }

      let res = `|File Name|File Size|\n|-----|:-----:|\n`;
      for(let item of filteredFiles) {
        res += `|${item[0]}|${item[1]}|\n`
      }
      return res;
    };

    if(count > 0) {
      octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body: errorBody,
      });

      octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body: getTableDataString(invalidFiles),
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

  } catch (error) {
    core.setFailed(error.message);
  }
};

main();
