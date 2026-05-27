import { getUILabel } from "../data/arabicTranslations";
import MatchingGamePage from "./MatchingGamePage";

// Level 3: Match emoji pictures to lowercase words
export default function MatchingLevel3Page() {
  return (
    <MatchingGamePage
      level={3}
      title={getUILabel("Level 3: Pictures")}
      headerClass="gradient-purple"
    />
  );
}
