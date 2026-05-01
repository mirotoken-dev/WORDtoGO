import MatchingGamePage from "./MatchingGamePage";

// Level 1: Match uppercase letters to lowercase letters
export default function MatchingLevel1Page() {
  return (
    <MatchingGamePage
      level={1}
      title="Level 1: Letters"
      headerClass="gradient-blue"
    />
  );
}
