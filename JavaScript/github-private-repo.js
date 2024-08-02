let config = {
  username: "Peng-YM", // 用户名
  token: "Your token", // token
};

// 从 BoxJS 加载用户配置
const boxConfig = $prefs.valueForKey("github_private_repo");
if (boxConfig) {
  config = JSON.parse(boxConfig);
}

// 获取请求的用户名
const usernameMatch = $request.url.match(/https:\/\/(?:raw|gist)\.githubusercontent\.com\/([^\/]+)\//);
const username = usernameMatch ? usernameMatch[1] : null;

// 定义处理函数
function handleRequest() {
  if (username && username === config.username) {
    console.log(`ACCESSING PRIVATE REPO: ${$request.url}`);
    $done({ headers: { ...$request.headers, Authorization: `token ${config.token}` } });
  } else {
    $done({});
  }
}

// 检查是否需要处理嵌套引用
if ($request.url.includes("githubusercontent.com")) {
  handleRequest();
} else {
  // 处理公开仓库中引用的私有仓库文件
  const fetch = require("node-fetch");
  fetch($request.url)
    .then(response => response.text())
    .then(content => {
      const privateRepoMatch = content.match(/https:\/\/(?:raw|gist)\.githubusercontent\.com\/([^\/]+)\//);
      if (privateRepoMatch && privateRepoMatch[1] === config.username) {
        console.log(`FOUND PRIVATE REPO REFERENCE IN PUBLIC REPO: ${privateRepoMatch[0]}`);
        fetch(privateRepoMatch[0], {
          headers: { Authorization: `token ${config.token}` }
        })
        .then(privateResponse => privateResponse.text())
        .then(privateContent => {
          $done({ response: { body: privateContent } });
        });
      } else {
        $done({ response: { body: content } });
      }
    })
    .catch(error => {
      console.error(error);
      $done({});
    });
}
