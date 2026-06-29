# Worker Prompt

你是本次任务的 worker。你不是仓库里唯一的 agent，不要回滚别人改动。

目标：
{{TASK}}

你负责的文件/模块：
{{SCOPE}}

你的具体任务：
{{ASSIGNMENT}}

你不能改：
{{FORBIDDEN_SCOPE}}

验收标准：
{{ACCEPTANCE}}

完成后请输出：
1. 改了哪些文件。
2. 核心实现说明。
3. 运行了哪些验证。
4. 还剩什么风险。

限制：
- 不要执行 `git reset --hard`、`git checkout -- .`、强推、删除分支。
- 不要修改未分配给你的文件范围。
- 不要把密钥、cookie、token、密码写进提示、日志或提交内容。
