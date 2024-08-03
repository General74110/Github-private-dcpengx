let config = {
  username: "Peng-YM", // 默认用户名
  token: "Your token", // 默认 token
};

// 检查环境并从 BoxJS 读取用户配置
const isLoon = typeof $persistentStore !== 'undefined';
const isQX = typeof $prefs !== 'undefined';

if (isLoon) {
  const boxConfig = $persistentStore.read("github_private_repo");
  if (boxConfig) {
    config = JSON.parse(boxConfig);
  }
} else if (isQX) {
  const boxConfig = $prefs.valueForKey("github_private_repo");
  if (boxConfig) {
    config = JSON.parse(boxConfig);
  }
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

// 处理嵌套引用的函数
function fetchContent(url) {
  const fetchOptions = {
    url: url,
    headers: { 'User-Agent': 'Mozilla/5.0' }
  };

  const fetch = isLoon ? $httpClient.get : isQX ? $task.fetch : null;

  fetch(fetchOptions, function (error, response, data) {
    if (error) {
      console.error(`Error fetching content: ${error}`);
      $done({});
    } else {
      const privateRepoMatch = data.match(/https:\/\/(?:raw|gist)\.githubusercontent\.com\/([^\/]+)\//);
      if (privateRepoMatch && privateRepoMatch[1] === config.username) {
        console.log(`FOUND PRIVATE REPO REFERENCE IN PUBLIC REPO: ${privateRepoMatch[0]}`);
        const privateFetchOptions = {
          url: privateRepoMatch[0],
          headers: { Authorization: `token ${config.token}` }
        };

        fetch(privateFetchOptions, function (privateError, privateResponse, privateData) {
          if (privateError) {
            console.error(`Error fetching private content: ${privateError}`);
            $done({});
          } else {
            $done({ response: { body: privateData } });
          }
        });
      } else {
        $done({ response: { body: data } });
      }
    }
  });
}

// 检查并处理请求
if ($request.url.includes("githubusercontent.com")) {
  handleRequest();
} else {
  fetchContent($request.url);
}