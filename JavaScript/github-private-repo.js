let config = {
  username: "default_username", // 默认用户名
  token: "default_token"       // 默认 token
};

// 从持久存储中读取配置
if (typeof $persistentStore !== 'undefined') {
  // Loon 环境
  const boxConfig = $persistentStore.read("github_private_repo");
  if (boxConfig) {
    config = JSON.parse(boxConfig);
  }
} else if (typeof $prefs !== 'undefined') {
  // Quantumult X 环境
  const boxConfig = $prefs.valueForKey("github_private_repo");
  if (boxConfig) {
    config = JSON.parse(boxConfig);
  }
}

// 获取请求的用户名
const usernameMatch = $request.url.match(/https:\/\/(?:raw|gist)\.githubusercontent\.com\/([^\/]+)\//);
const username = usernameMatch ? usernameMatch[1] : null;

// 检查 URL 中是否包含特定关键词
const isTargetRepo = $request.url.includes("General74110");

// 处理请求的函数
function handleRequest() {
  if (username && username === config.username && isTargetRepo) {
    log(`ACCESSING PRIVATE REPO: ${$request.url}`);
    $done({ headers: { ...$request.headers, Authorization: `token ${config.token}` } });
  } else {
    $done({});
  }
}

// 记录日志的函数
function log(message) {
  if (typeof $notify !== 'undefined') {
    // Quantumult X 环境
    $notify("GitHub Private Repo", "", message);
  } else if (typeof console !== 'undefined') {
    // Loon 环境
    console.log(message);
  }
}

// 直接处理请求
handleRequest();