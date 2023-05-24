const core = require("@actions/core");
const github = require("@actions/github");
const exec = require("@actions/exec");
const { Octokit } = require("@octokit/rest");
const fs = require('fs');


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

    let ignoreArray = [];
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

    /**
     * Check if array assets file name contains inside .ignore-assets file or not.
     * If its contains then remove those images from sourceArray and return new array.
     * 
     * @param {Array} sourceArray Array of all assets files.
     * @returns Array of files.
     */
    function getAssetsIgnoreFiles(sourceArray) {
      const file=`${inputs.target_folder}/.assets-ignore`;
      try {
        ignoreArray = fs.readFileSync(file).toString().split("\n");

        if (ignoreArray.length > 0) {
          return sourceArray.filter (val => !ignoreArray.find(ival => val.endsWith(ival)));
        }
      } catch (e) {
        // File not found exception.
      }

      return sourceArray;
    }

    await exec.exec(`find ${inputs.target_folder} -type f \( -name "*.jpeg" -o -name "*.png" -o -name "*.svg" -o -name "*.gif" -o -name "*.jpg" \) -size +${inputs.thrashold_size}k -exec ls -lh {} \;`, null, options);

    const arrayOutput = getAssetsIgnoreFiles(myOutput.split("\n"));

    const count = arrayOutput.length - 1;

    const invalidFiles = [...arrayOutput];

    const successBody = ` Woohooo :rocket: !!! Congratulations, your all assets are less than ${inputs.thrashold_size}Kb.`
    const errorBody = `Oops :eyes: !!! You have ${count} assets with size more than ${inputs.thrashold_size}Kb. Please optimize them. If you unable to optimize these assets, you can use .assets-ignore file and add these assets in .assets-ignore file. For more details read readme`

    const getTableDataString = (invalidFiles) => {
      let filteredFiles = [];

      for(let item of invalidFiles) {
        const fileName = item.split(" ").slice(-1).pop();
        const fileSize = item.split(" ")[4];
        if(fileName && fileSize) filteredFiles.push([fileName, fileSize]);
      }

      let res = `### Invalid Files\n|File Name|File Size|\n|-----|:-----:|\n`;
      for(let item of filteredFiles) {
        res += `|${item[0]}|${item[1]}|\n`
      }
      return res;
    };

    const getAllIgnoredFileString = (ignoreArray) => {
      let res = `### All .assets-ignored Files\n|File Name\n|-----|\n`;
      for(const item of ignoreArray) {
        res += `|${item}|\n`
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

      if (ignoreArray.length) {
        octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: issueNumber,
          body: getAllIgnoredFileString(ignoreArray),
        });
      }

      core.setFailed('Invalid size assets exists !!!');
    }else {
      octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body: successBody,
      });

      if (ignoreArray.length) {
        octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: issueNumber,
          body: getAllIgnoredFileString(ignoreArray),
        });
      }
    }

  } catch (error) {
    core.setFailed(error.message);
  }
};

main();
