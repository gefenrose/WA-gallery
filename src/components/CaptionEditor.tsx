type CaptionEditorProps = {
  id: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

export default function CaptionEditor({ id, value, placeholder, onChange }: CaptionEditorProps) {
  return (
    <textarea
      id={id}
      className="caption-editor"
      value={value}
      placeholder={placeholder}
      rows={3}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
