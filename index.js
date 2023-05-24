const core = require("@actions/core");
const github = require("@actions/github");
const exec = require("@actions/exec");
const { Octokit } = require("@octokit/rest");
const fs = require('fs');

const convertBytes = function(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]

  if (bytes == 0) {
    return "n/a"
  }

  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))

  if (i == 0) {
    return bytes + " " + sizes[i]
  }

  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i]
}

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
      const file=`.assets-ignore`;
      exec.exec(`echo ${sourceArray}`);
      try {
        ignoreArray = fs.readFileSync(file).toString().split("\n");
        exec.exec(`echo ${ignoreArray}`);

        if (ignoreArray.length > 0) {
          return sourceArray.filter (v => {
            const fileName = v.split(" ").slice(-1).pop()
            return ignoreArray.indexOf(fileName) === -1;
          })
        }
      } catch (e) {
        // File not found exception.
      }

      exec.exec(`echo ${sourceArray}`);

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

    /**
     * Get all Ignored file data as github comment string format.
     * 
     * @param {Array} ignoreArray array of files which is added in .assets-ignore file.
     * @returns Promise of github comment string.
     */
    const getAllIgnoredFileString = (ignoreArray) => {
      return new Promise((resolve, reject) => {
        let res = `### All .assets-ignored Files\n|File Name|File Size\n|-----|:-----:|\n`;
        for(let index=0; index < ignoreArray.length; index++) {
          const item = ignoreArray[index];
          fs.stat(item, (err, fileStats) => {
            if (err) {
              res += `|${item}|None|\n`
            } else {
              const result = convertBytes(fileStats.size)
              res += `|${item}|${result}|\n`
            }

            if (index === ignoreArray.length-1) {
              resolve(res);
            }
          })
        }
      })
    };

    /**
     * Publish .assets-ignore entries in github comment.
     * 
     * @param {Array} ignoreArray array of files which is added in .assets-ignore file.
     */
    const publishIgnoreAssetsTable = (ignoreArray) => {
      if (ignoreArray.length) {
        octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: issueNumber,
          body: getAllIgnoredFileString(ignoreArray),
        });
      }
    }

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

      publishIgnoreAssetsTable(ignoreArray);

      core.setFailed('Invalid size assets exists !!!');
    }else {
      octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body: successBody,
      });

      publishIgnoreAssetsTable(ignoreArray);
    }

  } catch (error) {
    core.setFailed(error.message);
  }
};

main();
