let config = {
  username: "Peng-YM", // 默认用户名
  token: "Your token", // 默认 token
};

// 从 BoxJS 读取用户配置
const boxConfig = $prefs.valueForKey("github_private_repo");
if (boxConfig) {
  config = JSON.parse(boxConfig);
}

// 获取请求的用户名
const usernameMatch = $request.url.match(/https:\/\/(?:raw|gist)\.githubusercontent\.com\/([^\/]+)\//);
const username = usernameMatch ? usernameMatch[1] : null;

// 处理请求函数
function handleRequest() {
  if (username && username === config.username) {
    console.log(`ACCESSING PRIVATE REPO: ${$request.url}`);
    $done({ headers: { ...$request.headers, Authorization: `token ${config.token}` } });
  } else {
    $done({});
  }
}

// 处理嵌套引用的函数
function fetchContent(url) {
  $task.fetch({ url: url, headers: { 'User-Agent': 'Mozilla/5.0' } }).then(response => {
    return response.text().then(data => {
      // 输出处理的数据
      console.log(`Fetched data from: ${url}`);
      console.log(`Data: ${data}`);
      
      // 查找嵌套的私有仓库链接
      const privateRepoMatch = data.match(/https:\/\/(?:raw|gist)\.githubusercontent\.com\/[^\/]+\/General74110\/[^\/]+/);
      if (privateRepoMatch) {
        console.log(`FOUND PRIVATE REPO REFERENCE IN PUBLIC REPO: ${privateRepoMatch[0]}`);
        const privateFetchOptions = {
          url: privateRepoMatch[0],
          headers: { Authorization: `token ${config.token}` }
        };

        // 请求嵌套的私有资源
        $task.fetch(privateFetchOptions).then(privateResponse => {
          return privateResponse.text().then(privateData => {
            $done({ response: { body: privateData } });
          }).catch(error => {
            console.error(`Error fetching private content: ${error}`);
            $done({});
          });
        }).catch(error => {
          console.error(`Error fetching private content: ${error}`);
          $done({});
        });
      } else {
        $done({ response: { body: data } });
      }
    }).catch(error => {
      console.error(`Error processing content: ${error}`);
      $done({});
    });
  }).catch(error => {
    console.error(`Error fetching content: ${error}`);
    $done({});
  });
}

// 检查并处理请求
if ($request.url.includes("githubusercontent.com")) {
  handleRequest();
} else {
  fetchContent($request.url);
}