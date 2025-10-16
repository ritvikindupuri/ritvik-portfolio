import { motion } from "framer-motion";
import { Award } from "lucide-react";

interface CertificationsProps {
  isOwner: boolean;
}

const certifications = [
  {
    name: "CompTIA Security+",
    logo: "🔒",
    credentialId: "SEC-2024-XXX",
    issueDate: "Jan 2024",
    expirationDate: "Jan 2027",
  },
  {
    name: "AWS Certified Cloud Practitioner",
    logo: "☁️",
    credentialId: "AWS-CCP-2024",
    issueDate: "Mar 2024",
    expirationDate: "Mar 2027",
  },
  {
    name: "Certified Ethical Hacker",
    logo: "🎯",
    credentialId: "CEH-2024-XXX",
    issueDate: "May 2024",
    expirationDate: "May 2027",
  },
];

export const Certifications = ({ isOwner }: CertificationsProps) => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3 mb-12 justify-center">
            <Award className="w-8 h-8 text-primary" />
            <h2 className="text-4xl font-bold font-sans">Certifications</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {certifications.map((cert, index) => (
              <motion.div
                key={cert.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 hover:shadow-glow transition-all"
              >
                <div className="text-center space-y-4">
                  <div className="text-6xl">{cert.logo}</div>
                  <h3 className="text-xl font-bold font-sans">{cert.name}</h3>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      <span className="text-primary">Credential ID:</span> {cert.credentialId}
                    </p>
                    <p>
                      <span className="text-primary">Issued:</span> {cert.issueDate}
                    </p>
                    <p>
                      <span className="text-primary">Expires:</span> {cert.expirationDate}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
