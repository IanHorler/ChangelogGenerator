let commits;

function parseCommit(commit) {
    const commitRegex =
        /^(?<type>\w+)(\((?<scope>[^)]+)\))?: (?<description>[^\n]+)(?:\n\n(?<bodyAndFooter>[\s\S]+))?$/;
    const match = commit.match(commitRegex);

    if (!match) {
        throw new Error("Invalid commit message format");
    }

    const {type, scope, description, bodyAndFooter} = match.groups;
    let body = "";
    let footer = "";

    if (bodyAndFooter) {
        const parts = bodyAndFooter.split("\n\n");
        const footerIndex = parts.findIndex(part =>
            /^(Closes|Fixes|Resolves|Refs|Co-authored-by|on-behalf-of)/.test(part)
        );
        if (footerIndex !== -1) {
            body = parts.slice(0, footerIndex).join("\n\n");
            footer = parts.slice(footerIndex).join("\n\n");
        } else {
            body = parts.join("\n\n");
        }
    }

    return {type, scope, description, body, footer};
}

function parseAllCommits() {
    const commits = document.getElementById("commits").value.split("\n\n\n");
    const parsedCommits = commits.map(parseCommit);
    return parsedCommits;
}

function parseRule(rule) {
    let string = rule;

    const firstQuote = string.indexOf('"');
    const lastQuote = string.lastIndexOf('"');

    if (firstQuote > -1 && lastQuote > -1) {
        string = string.slice(firstQuote + 1, lastQuote + 1);
    } else return "";

    const vars = string.match(/%.+%/g);
    if (vars) {
        for (let i = 0; i < vars.length; i++) {
            const varContent = vars[i].slice(1, -1);
            string = string.replace(vars[i], parseRule(varContent));
        }
    }

    const ifs = rule.match(/!?\[.+\]/g);

    if (ifs) {
        for (let i = 0; i < ifs.length; i++) {
            const statement = ifs[i].slice(1, -1);
            const type = statement[0] == "!" ? statement.slice(1) : statement;
            const matchingCommits = commits.filter(commit => commit.type == type);
            if (matchingCommits.length == 0) {
                if (statement[0] != "!") return "";
            } else if (statement[0] == "!") return "";

            const firstBracket = string.indexOf("{");
            const lastBracket = string.lastIndexOf("}");

            let instanceRule;

            if (firstBracket > -1 && firstBracket > -1) {
                instanceRule = string.slice(firstBracket + 1, lastBracket);
            } else instanceRule = "";

            let instances = "";

            for (let j = 0; j < matchingCommits.length; j++) {
                let instance = instanceRule;
                instance = instance.replace(/<type>/, matchingCommits[j].type);
                instance = instance.replace(/<scope>/, matchingCommits[j].type);
                instance = instance.replace(/<description>/, matchingCommits[j].description);
                instance = instance.replace(/<body>/, matchingCommits[j].body);
                instance = instance.replace(/<footer>/, matchingCommits[j].footer);
                instances += instance;
            }

            string =
                firstBracket > -1 && firstBracket > -1
                    ? string.slice(0, firstBracket) + instances + string.slice(lastBracket + 1)
                    : string;
        }
    }

    return string.slice(0, -1);
}

function generate() {
    const syntax = document.getElementById("syntax").value;
    const rules = syntax.split("\n");
    commits = parseAllCommits();
    let result = "";
    for (let i = 0; i < rules.length; i++) {
        let rule = rules[i];
        result += parseRule(rule).replaceAll("\\n", "\n");
    }
    document.getElementById("output").value = result;
}

function toggleGuide() {
    const guide = document.getElementById("guide");
    const overlay = document.getElementById("overlay");
    guide.style.display = guide.style.display == "block" ? "none" : "block";
    overlay.style.display = overlay.classList.toggle("guide-visible");
}
