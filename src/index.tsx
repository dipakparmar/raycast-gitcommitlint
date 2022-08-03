import { Form, Clipboard, ActionPanel, Action, showHUD, popToRoot } from "@raycast/api";
import { useState } from "react";

interface CommitValues {
  type: string;
  customType?: string;
  scope?: string;
  subject?: string;
  body?: string;
  footer?: string;
  withEmoji?: boolean;
  isBreakingChange?: boolean;
  breakingBody?: string;
  isIssueAffected?: boolean;
  issuesBody?: string;
  issues?: string;
}

interface CommitType {
  [key: string]: {
    description: string;
    title: string;
    emoji: string;
  };
}

const commitTypes: CommitType = {
  feat: {
    description: "A new feature",
    title: "Features",
    emoji: "✨",
  },
  fix: {
    description: "A bug fix",
    title: "Bug Fixes",
    emoji: "🐛",
  },
  docs: {
    description: "Documentation only changes",
    title: "Documentation",
    emoji: "📚",
  },
  style: {
    description:
      "Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)",
    title: "Styles",
    emoji: "💎",
  },
  refactor: {
    description: "A code change that neither fixes a bug nor adds a feature",
    title: "Code Refactoring",
    emoji: "📦",
  },
  perf: {
    description: "A code change that improves performance",
    title: "Performance Improvements",
    emoji: "🚀",
  },
  test: {
    description: "Adding missing tests or correcting existing tests",
    title: "Tests",
    emoji: "🚨",
  },
  build: {
    description: "Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)",
    title: "Builds",
    emoji: "🛠",
  },
  ci: {
    description:
      "Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)",
    title: "Continuous Integrations",
    emoji: "⚙️",
  },
  chore: {
    description: "Other changes that don't modify src or test files",
    title: "Chores",
    emoji: "♻️",
  },
  revert: {
    description: "Reverts a previous commit",
    title: "Reverts",
    emoji: "🗑",
  },
  custom: {
    description: "Custom type",
    title: "Your custom type",
    emoji: "📝",
  },
};

export default function Command(props: { draftValues?: CommitValues }) {
  const { draftValues } = props;
  const [type, setType] = useState<string>();
  const [isBreakingChange, setIsBreakingChange] = useState<boolean>(false);
  const [isIssueAffected, setIsIssueAffected] = useState<boolean>(false);
  const [customTypeError, setCustomTypeError] = useState<string | undefined>();
  const [scopeError, setScopeError] = useState<string | undefined>();
  const [breakingBody, setBreakingBody] = useState<string | undefined>();
  const [issuesBody, setIssuesBody] = useState<string | undefined>();
  const [footer, setFooter] = useState<string | undefined>();

  async function validateCustomType(type: string) {
    // check the type is one word string or else show error

    // check if the string starts with emoji (check with regex)
    // (\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])
    const emojiRegex =
      /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gm;
    if (!emojiRegex.test(type)) {
      setCustomTypeError("Custom type must start with emoji");
      return;
    }
    if (type.match(/^[a-zA-Z0-9]+$/)) {
      setCustomTypeError(undefined);
      return true;
    } else {
      setCustomTypeError("Custom type must be one word string without emoji or two with emoji");
      return false;
    }
  }

  async function validateScope(scope: string) {
    // check if scope is defined, if defined check if it is one string if not one word string show scopeError
    if (scope) {
      if (scope.match(/^[a-zA-Z0-9]+$/)) {
        setScopeError(undefined);
        return true;
      } else {
        setScopeError("Scope must be one word string");
        return false;
      }
    } else {
      setScopeError(undefined);
    }
  }

  async function generateFooter() {
    // console.log(!isBreakingChange, !isIssueAffected);
    if (!isBreakingChange) {
      // console.log("breaking change not checked, removing breaking change body");
      await setBreakingBody(undefined);
      // console.log("removed breaking change body: ", breakingBody);
    }
    if (!isIssueAffected) {
      // console.log("issue affected not checked, removing issue affected body");
      await setIssuesBody(undefined);
      // console.log("removed issue affected body: ", issuesBody);
    }
    let footerString = "";
    if (breakingBody !== undefined) {
      footerString += breakingBody;
    }
    if (issuesBody !== undefined) {
      if (breakingBody !== undefined) {
        footerString += "\n\n";
      }
      footerString += issuesBody;
    }
    // console.log("this is breaking body", breakingBody, " this is issues body", issuesBody);
    // console.log(footerString);

    await setFooter(footerString);
  }

  async function handleSubmit(values: CommitValues) {
    const { type, customType, withEmoji, scope, subject, body, footer } = values;

    let commitMessage = "";
    if (type !== "custom") {
      if (withEmoji) {
        commitMessage += `${commitTypes[type].emoji} ${type}`;
      } else {
        commitMessage += `${type}`;
      }
    } else {
      commitMessage += `${customType}`;
    }
    if (scope) {
      commitMessage += `(${scope})`;
    }
    commitMessage += ": ";
    if (subject) {
      commitMessage += subject;
    }
    if (body) {
      commitMessage += `\n\n${body}`;
    }
    if (footer) {
      commitMessage += `\n\n${footer}`;
    }

    console.log(values, "\n", commitMessage);
    await Clipboard.copy(commitMessage);
    showHUD("📋 Copied to Clipboard");
    popToRoot();
  }

  return (
    <Form
      enableDrafts
      actions={
        <ActionPanel>
          <Action.SubmitForm title="📋 Copy to Clipboard" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown
        id="type"
        title="Type"
        defaultValue={draftValues?.type || "feat"}
        info="the type of change that you're committing"
        onChange={setType}
      >
        {/* {Object.keys(commitTypes).map((k: string) => (
          <Form.Dropdown.Item value={k} title={commitTypes[k]} key={k} />
        ))} */}
        {Object.keys(commitTypes).map((k: string) => (
          <Form.Dropdown.Item value={k} title={k + ": " + commitTypes[k].title} icon={commitTypes[k].emoji} key={k} />
        ))}
      </Form.Dropdown>
      {type === "custom" && (
        <Form.TextField
          id="customType"
          title="Custom Type"
          defaultValue={draftValues?.customType}
          info="Your custom commit type - include the emoji if you would like"
          error={customTypeError}
          onChange={validateCustomType}
          placeholder="eg. 🔀 integration"
        />
      )}
      <Form.TextField
        id="scope"
        title="Scope"
        placeholder="eg. api"
        defaultValue={draftValues?.scope}
        info="scope of this change (e.g. component or file name)"
        error={scopeError}
        onChange={validateScope}
      />
      <Form.TextField
        id="subject"
        title="Subject"
        defaultValue={draftValues?.subject}
        placeholder="description of the change"
        info="a short, imperative tense description of the change"
      />
      <Form.TextArea
        id="body"
        title="Body"
        defaultValue={draftValues?.body}
        placeholder="longer detailed explanatory description of the change (optional)"
        info="use imperative, present tense: “change” not “changed” nor “changes” - includes motivation for the change and contrasts with previous behavior"
      />
      <Form.Checkbox
        id="isBreakingChange"
        label="Is breaking change?"
        defaultValue={draftValues?.isBreakingChange}
        onChange={setIsBreakingChange}
        info="check if this change is a breaking change"
      />
      {isBreakingChange && (
        <Form.TextArea
          id="breakingBody"
          title="Breaking Change Body"
          defaultValue={draftValues?.breakingBody}
          onChange={setBreakingBody}
          placeholder="Describe the breaking changes"
          info="use imperative, present tense: “change” not “changed” nor “changes” - includes motivation for the change and contrasts with previous behavior"
        />
      )}
      <Form.Checkbox
        id="isIssueAffected"
        label="Is issue affected?"
        defaultValue={draftValues?.isIssueAffected}
        onChange={setIsIssueAffected}
        info="check if this change affects an issue"
      />
      {isIssueAffected && (
        <Form.TextArea
          id="issuesBody"
          title="Issues Body"
          defaultValue={draftValues?.breakingBody}
          onChange={setIssuesBody}
          placeholder="Add issue references (e.g. 'fix #123', 're #123'.)"
          info="use imperative, present tense: “change” not “changed” nor “changes” - includes motivation for the change and contrasts with previous behavior"
        />
      )}
      {isBreakingChange || isIssueAffected ? (
        <Form.TextArea
          id="footer"
          title="Footer"
          value={draftValues?.footer || footer}
          onFocus={generateFooter}
          placeholder="breaking changes and ref. issues (optional)"
          info="contain any information about breaking changes with the description of the change, justification and migration notes - reference GitHub issues that this commit Closes. such as closed bugs should be listed in the footer prefixed with 'Closes' or 'Fixes' keyword like: 'Closes #234, #241'"
        />
      ) : (
        <Form.TextArea
          id="footer"
          title="Footer"
          defaultValue={draftValues?.footer || footer}
          placeholder="breaking changes and ref. issues (optional)"
          info="contain any information about breaking changes with the description of the change, justification and migration notes - reference GitHub issues that this commit Closes. such as closed bugs should be listed in the footer prefixed with 'Closes' or 'Fixes' keyword like: 'Closes #234, #241'"
        />
      )}

      {type !== "custom" && (
        <Form.Checkbox id="withEmoji" defaultValue={draftValues?.withEmoji} label="Include Emoji" storeValue />
      )}
    </Form>
  );
}
