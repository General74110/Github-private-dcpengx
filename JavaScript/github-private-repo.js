let config = {
  username: "default_username", // 默认用户名
  token: "default_token",       // 默认 token
};

// 从 BoxJS 读取用户配置
const boxConfig = $persistentStore.read("github_private_repo");
if (boxConfig) {
  config = JSON.parse(boxConfig);
}

// 获取请求的用户名
const usernameMatch = $request.url.match(/https:\/\/(?:raw|gist)\.githubusercontent\.com\/([^\/]+)\//);
const username = usernameMatch ? usernameMatch[1] : null;

// 检查 URL 中是否包含特定关键词(用户名)
const isTargetRepo = $request.url.includes("General74110");

// 定义处理函数
function handleRequest() {
  if (username && username === config.username && isTargetRepo) {
    console.log(`ACCESSING PRIVATE REPO: ${$request.url}`);
    $done({ headers: { ...$request.headers, Authorization: `token ${config.token}` } });
  } else {
    $done({});
  }
}

// 处理嵌套引用的函数
function fetchContent(url) {
  const fetch = require("node-fetch");
  fetch(url)
    .then(response => response.text())
    .then(content => {
      if (content.includes("General74110")) {
        const privateRepoMatch = content.match(/https:\/\/(?:raw|gist)\.githubusercontent\.com\/([^\/]+)\//);
        if (privateRepoMatch && privateRepoMatch[1] === config.username) {
          console.log(`FOUND PRIVATE REPO REFERENCE IN PUBLIC REPO: ${privateRepoMatch[0]}`);
          fetch(privateRepoMatch[0], {
            headers: { Authorization: `token ${config.token}` }
          })
          .then(privateResponse => privateResponse.text())
          .then(privateContent => {
            $done({ response: { body: privateContent } });
          })
          .catch(error => {
            console.error(`Error fetching private content: ${error}`);
            $done({});
          });
        } else {
          $done({ response: { body: content } });
        }
      } else {
        $done({ response: { body: content } });
      }
    })
    .catch(error => {
      console.error(`Error fetching content: ${error}`);
      $done({});
    });
}

// 检查并处理请求
if (isTargetRepo) {
  handleRequest();
} else {
  fetchContent($request.url);
}