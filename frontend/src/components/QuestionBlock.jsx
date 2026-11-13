export default function QuestionBlock({ question, value, onChange, disabled = false }) {
  if (!question) return null;
  return <fieldset className="question-block" disabled={disabled}>
    <legend>{question.label || question.question}</legend>
    {(question.options || []).map((option) => {
      const text = typeof option === "string" ? option : option.label;
      const id = typeof option === "string" ? option : option.value;
      return <label key={id}><input type="radio" name={question.id} value={id} checked={value === id} onChange={() => onChange?.(id)} /> {text}</label>;
    })}
  </fieldset>;
}
