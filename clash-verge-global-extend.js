function main(config, profileName) {
  const blockedNodeKeywords = [
    "更新订阅",
    "特殊时期",
    "故障",
    "GB",
    "Expire"
  ];

  const aiGroupName = "AI代理";
  const fallbackGroup = "节点选择";

  const profileKeywordMap = {
    "订阅A": ["新加坡", "sg", "singapore"],
    "订阅B": ["日本", "jp", "japan"],
    "订阅C": ["美国", "us", "united states", "usa"]
  };

  const defaultAiNodeKeywords = [
    "新加坡",
    "sg",
    "日本",
    "jp",
    "美国",
    "us"
  ];

  const aiNodeKeywords = profileKeywordMap[profileName] || defaultAiNodeKeywords;

  const includesAny = (name, keywords) => {
    const text = String(name).toLowerCase();
    return keywords.some(keyword => text.includes(String(keyword).toLowerCase()));
  };

  const isBlockedNode = name => includesAny(name, blockedNodeKeywords);

  const isAiNode = name => {
    if (isBlockedNode(name)) return false;
    return includesAny(name, aiNodeKeywords);
  };

  config.proxies = (config.proxies || []).filter(proxy => {
    return proxy && proxy.name && !isBlockedNode(proxy.name);
  });

  const allProxyNames = config.proxies
    .map(proxy => proxy.name)
    .filter(Boolean);

  const aiProxyNames = allProxyNames.filter(isAiNode);

  config["proxy-groups"] = (config["proxy-groups"] || []).map(group => {
    if (Array.isArray(group.proxies)) {
      group.proxies = group.proxies.filter(name => !isBlockedNode(name));
    }
    return group;
  });

  config["proxy-groups"] = config["proxy-groups"].filter(group => {
    return group.name !== aiGroupName;
  });

  const existingGroupNames = config["proxy-groups"].map(group => group.name);
  const fallbackItems = [];

  if (existingGroupNames.includes(fallbackGroup)) {
    fallbackItems.push(fallbackGroup);
  }

  fallbackItems.push("DIRECT");

  const aiGroup = {
    name: aiGroupName,
    type: "select",
    proxies: [
      ...(aiProxyNames.length > 0 ? aiProxyNames : allProxyNames),
      ...fallbackItems
    ].filter((item, index, arr) => item && arr.indexOf(item) === index)
  };

  config["proxy-groups"].unshift(aiGroup);

  const customRules = [
    // ---------- 强制直连 ----------
    "DOMAIN-KEYWORD,grammarly,DIRECT",
    "DOMAIN-KEYWORD,office365,DIRECT",
    "DOMAIN-KEYWORD,fudan.edu,DIRECT",
    "DOMAIN-KEYWORD,ulinas.myds.me,DIRECT",
    "DOMAIN-KEYWORD,synology,DIRECT",
    "DOMAIN-KEYWORD,elsevier,DIRECT",
    "DOMAIN-SUFFIX,cell.com,DIRECT",
    "DOMAIN-KEYWORD,springernature,DIRECT",
    "DOMAIN-SUFFIX,arxiv.org,DIRECT",
    "DOMAIN-KEYWORD,zotero,DIRECT",

    // ---------- AI / Google ----------
    `DOMAIN-SUFFIX,gemini.google.com,${aiGroupName}`,
    `DOMAIN-SUFFIX,ai.google.dev,${aiGroupName}`,
    `DOMAIN-SUFFIX,makersuite.google.com,${aiGroupName}`,
    `DOMAIN-SUFFIX,generativeai.google,${aiGroupName}`,

    // ---------- Claude / Anthropic ----------
    `DOMAIN-SUFFIX,claude.com,${aiGroupName}`,
    `DOMAIN-SUFFIX,claude.ai,${aiGroupName}`,
    `DOMAIN-SUFFIX,anthropic.com,${aiGroupName}`,

    // ---------- OpenAI / ChatGPT ----------
    `DOMAIN-SUFFIX,chatgpt.com,${aiGroupName}`,
    `DOMAIN-SUFFIX,openai.com,${aiGroupName}`,
    `DOMAIN-SUFFIX,oaistatic.com,${aiGroupName}`,
    `DOMAIN-SUFFIX,oaiusercontent.com,${aiGroupName}`
  ];

  config.rules = customRules.concat(config.rules || []);

  return config;
}
