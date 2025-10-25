import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const languages = [
  { code: "hi", name: "हिंदी", label: "Hindi" },
  { code: "en", name: "English", label: "English" },
  { code: "ta", name: "தமிழ்", label: "Tamil" },
];

const Language = () => {
  const navigate = useNavigate();

  const selectLanguage = (code: string, name: string) => {
    localStorage.setItem("selectedLanguage", code);
    localStorage.setItem("selectedLanguageName", name);
    navigate("/onboarding");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center shadow-strong">
            <Globe className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            Welcome to PalmConnect
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose your preferred language
          </p>
        </div>

        <div className="space-y-4">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant="language"
              size="xl"
              className="w-full"
              onClick={() => selectLanguage(lang.code, lang.name)}
            >
              <span className="text-2xl">{lang.name}</span>
            </Button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          Empowering oil palm farmers with trust and technology
        </p>
      </div>
    </div>
  );
};

export default Language;
