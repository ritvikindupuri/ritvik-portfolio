import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Award } from "lucide-react";
import { useEffect, useState } from "react";

interface Certification {
  id: string;
  name: string;
  logo: string;
  credentialId: string;
  credentialUrl: string;
  issueDate: string;
  expirationDate: string;
  display_order?: number;
  description?: string;
}

// Generate professional description based on certification name
const generateCertDescription = (name: string): string => {
  const nameLower = name.toLowerCase();

  if (nameLower.includes("cybersecurity") || nameLower.includes("cc") || nameLower.includes("isc2")) {
    return "Validates foundational knowledge in cybersecurity principles, incident response, and security operations.";
  }
  if (nameLower.includes("security+") || nameLower.includes("comptia security")) {
    return "Industry-recognized certification demonstrating core security skills and best practices.";
  }
  if (nameLower.includes("network+")) {
    return "Validates networking concepts, infrastructure, and troubleshooting capabilities.";
  }
  if (nameLower.includes("aws") || nameLower.includes("amazon")) {
    return "Demonstrates proficiency in Amazon Web Services cloud architecture and deployment.";
  }
  if (nameLower.includes("azure") || nameLower.includes("microsoft")) {
    return "Certifies expertise in Microsoft Azure cloud services and solutions.";
  }
  if (nameLower.includes("google") || nameLower.includes("gcp")) {
    return "Validates skills in Google Cloud Platform technologies and services.";
  }
  if (nameLower.includes("cissp")) {
    return "Premier certification for security professionals covering comprehensive security domains.";
  }
  if (nameLower.includes("ceh") || nameLower.includes("ethical hacker")) {
    return "Demonstrates advanced penetration testing and ethical hacking methodologies.";
  }
  if (nameLower.includes("python") || nameLower.includes("programming")) {
    return "Validates programming proficiency and software development best practices.";
  }
  if (nameLower.includes("machine learning") || nameLower.includes("ml") || nameLower.includes("ai")) {
    return "Certifies expertise in machine learning algorithms and AI implementation.";
  }
  if (nameLower.includes("data")) {
    return "Demonstrates proficiency in data analysis, management, and visualization.";
  }

  return `Professional certification validating expertise in ${name.split(" ").slice(0, 3).join(" ")}.`;
};

interface SortableCertProps {
  cert: Certification;
  index: number;
}

const SortableCert = ({ cert, index }: SortableCertProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        delay: index * 0.15,
        duration: 0.6,
        type: "spring",
        stiffness: 100,
      }}
      viewport={{ once: true }}
      className="group relative"
    >
      <div className="relative w-72 min-h-[24rem]">
        <motion.div
          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent/20 via-primary/20 to-accent/20 blur-2xl"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: index * 0.5,
          }}
        />

        <motion.div
          className="relative h-full bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl border-2 border-accent/30 rounded-3xl p-8 shadow-2xl overflow-visible"
          whileHover={{
            rotateY: 5,
            rotateX: 5,
            scale: 1.05,
            borderColor: "hsl(var(--accent) / 0.6)",
          }}
          transition={{ duration: 0.3 }}
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-32 h-32 border border-accent rounded-full" />
            <div className="absolute bottom-4 left-4 w-24 h-24 border border-primary rounded-full" />
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-accent/50"
              style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
            />
          </div>

          <div className="relative z-10 h-full flex flex-col items-center justify-between text-center">
            <motion.div
              className="relative mb-4"
              whileHover={{ scale: 1.1, rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-20 h-20 flex items-center justify-center bg-gradient-to-br from-accent/20 to-primary/20 rounded-2xl border-2 border-accent/40 shadow-glow relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/30 to-transparent"
                  animate={{
                    y: ["-100%", "200%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "linear",
                  }}
                />
                {cert.logo.startsWith("data:") ? (
                  <img src={cert.logo} alt={cert.name} className="w-14 h-14 object-contain relative z-10" />
                ) : (
                  <span className="text-4xl relative z-10">{cert.logo}</span>
                )}
              </div>
            </motion.div>

            <div className="space-y-2 flex-1 flex flex-col justify-center mt-2">
              <h3 className="text-xl font-bold bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent leading-tight px-2">
                {cert.name}
              </h3>

              {cert.description && <p className="text-xs text-muted-foreground/80 px-2">{cert.description}</p>}

              <motion.div
                className="w-16 h-1 bg-gradient-to-r from-transparent via-accent to-transparent mx-auto rounded-full"
                animate={{
                  width: ["64px", "96px", "64px"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>

            <div className="space-y-2.5 w-full">
              {(cert.credentialId || cert.credentialUrl) && (
                <div className="bg-accent/10 backdrop-blur-sm rounded-xl p-3 border border-accent/20">
                  {cert.credentialId && (
                    <>
                      <p className="text-xs text-accent/80 font-semibold mb-1">CREDENTIAL ID</p>
                      <p className="font-mono text-xs text-foreground/90 break-all">{cert.credentialId}</p>
                    </>
                  )}
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-accent hover:text-accent/80 transition-colors font-medium"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      Verify Credential
                    </a>
                  )}
                </div>
              )}

              {(cert.issueDate || cert.expirationDate) && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {cert.issueDate && (
                    <div className="bg-primary/10 rounded-lg p-2.5 border border-primary/20">
                      <p className="text-primary/70 font-semibold mb-1">ISSUED</p>
                      <p className="font-mono text-foreground/90 text-xs">{cert.issueDate}</p>
                    </div>
                  )}
                  {cert.expirationDate && (
                    <div className="bg-primary/10 rounded-lg p-2.5 border border-primary/20">
                      <p className="text-primary/70 font-semibold mb-1">EXPIRES</p>
                      <p className="font-mono text-foreground/90 text-xs">{cert.expirationDate}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-accent/40 rounded-tl-lg" />
            <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-accent/40 rounded-tr-lg" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-primary/40 rounded-bl-lg" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-primary/40 rounded-br-lg" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const initialCertifications: Certification[] = [];

export const Certifications = () => {
  const [certifications, setCertifications] = useState<Certification[]>(initialCertifications);
  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    const { data, error } = await supabase
      .from("certifications")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching certifications:", error);
      return;
    }

    if (data && data.length > 0) {
      const certs = data.map((cert) => ({
        id: cert.id,
        name: cert.name,
        logo: cert.image_url || "🏆",
        credentialId: cert.credential_url?.startsWith("http") ? "" : cert.credential_url || "",
        credentialUrl: cert.credential_url?.startsWith("http") ? cert.credential_url : "",
        issueDate: cert.date
          ? new Date(cert.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
          : "",
        expirationDate: cert.expiration_date
          ? new Date(cert.expiration_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
          : "",
        display_order: cert.display_order,
        description: (cert as any).description || generateCertDescription(cert.name),
      }));
      setCertifications(certs);
    }
  };
  return (
    <section className="py-32 px-4 bg-background relative overflow-hidden">
      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="text-center space-y-3 mb-16">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-accent/10 mb-4 shadow-glow"
            >
              <Award className="w-10 h-10 text-accent" />
            </motion.div>
            <h2 className="text-6xl md:text-7xl font-bold font-sans text-gradient-cyber">Certifications</h2>
            <div className="w-32 h-1.5 bg-gradient-to-r from-primary to-accent mx-auto rounded-full shadow-glow" />
          </div>

          {/* Hexagonal Grid Layout - Unique & Eye-catching */}
          <div className="relative max-w-6xl mx-auto">
            {/* Main certification showcase */}
            <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
              <>
                {certifications.map((cert, index) => (
                  <SortableCert key={cert.id} cert={cert} index={index} />
                ))}
              </>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
