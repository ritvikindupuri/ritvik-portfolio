import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Award, Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CertificationsProps {
  isOwner: boolean;
}

const initialCertifications = [
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
  const [certifications, setCertifications] = useState(initialCertifications);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCert, setNewCert] = useState({
    name: "",
    logo: "",
    credentialId: "",
    issueDate: "",
    expirationDate: "",
  });
  const [uploadedLogo, setUploadedLogo] = useState<string>("");

  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    const { data, error } = await supabase
      .from('certifications')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching certifications:', error);
      return;
    }

    if (data && data.length > 0) {
      const certs = data.map(cert => ({
        name: cert.name,
        logo: cert.image_url || "🏆",
        credentialId: cert.credential_url || "",
        issueDate: cert.date ? new Date(cert.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "",
        expirationDate: ""
      }));
      setCertifications(certs);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedLogo(reader.result as string);
        setNewCert({ ...newCert, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCert = async () => {
    if (!newCert.name || !newCert.logo) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('certifications')
      .insert({
        user_id: user.id,
        name: newCert.name,
        issuer: "Issuer",
        date: new Date().toISOString().split('T')[0],
        image_url: newCert.logo,
        credential_url: newCert.credentialId
      });

    if (error) {
      toast.error("Failed to add certification");
      console.error('Error adding certification:', error);
      return;
    }

    setCertifications([...certifications, newCert]);
    setNewCert({ name: "", logo: "", credentialId: "", issueDate: "", expirationDate: "" });
    setUploadedLogo("");
    setIsAddDialogOpen(false);
    toast.success("Certification added successfully");
  };

  const handleRemoveCert = async (certName: string) => {
    const { error } = await supabase
      .from('certifications')
      .delete()
      .eq('name', certName);

    if (error) {
      toast.error("Failed to remove certification");
      console.error('Error removing certification:', error);
      return;
    }

    setCertifications(certifications.filter((c) => c.name !== certName));
    toast.success(`Removed ${certName} certification`);
  };

  return (
    <section className="py-20 px-4 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-accent/5 blur-[120px] rounded-full" />
      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="text-center space-y-4 mb-16">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-4"
            >
              <Award className="w-8 h-8 text-accent" />
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-bold font-sans bg-gradient-cyber bg-clip-text text-transparent">
              Certifications
            </h2>
            <div className="w-24 h-1 bg-gradient-cyber mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-6xl mx-auto auto-rows-fr">
            {certifications.map((cert, index) => (
              <motion.div
                key={cert.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="group relative bg-gradient-card border border-border rounded-2xl p-8 hover:border-accent/50 hover:shadow-elegant transition-all duration-300"
              >
                {isOwner && (
                  <button
                    onClick={() => handleRemoveCert(cert.name)}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-full p-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                
                <div className="text-center space-y-6">
                  <div className="text-6xl mx-auto w-20 h-20 flex items-center justify-center">
                    {cert.logo.startsWith('data:') ? (
                      <img src={cert.logo} alt={cert.name} className="w-full h-full object-contain" />
                    ) : (
                      cert.logo
                    )}
                  </div>
                  <h3 className="text-xl font-bold font-sans group-hover:text-accent transition-colors">{cert.name}</h3>
                  
                  <div className="space-y-3 text-sm">
                    {cert.credentialId && (
                      <p className="text-muted-foreground">
                        <span className="text-accent font-medium">Credential ID:</span> {cert.credentialId}
                      </p>
                    )}
                    {cert.issueDate && (
                      <p className="text-muted-foreground">
                        <span className="text-accent font-medium">Issued:</span> {cert.issueDate}
                      </p>
                    )}
                    {cert.expirationDate && (
                      <p className="text-muted-foreground">
                        <span className="text-accent font-medium">Expires:</span> {cert.expirationDate}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Add Certification Button - Owner Only */}
            {isOwner && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <motion.button
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: certifications.length * 0.1, duration: 0.5 }}
                    viewport={{ once: true }}
                    className="border-2 border-dashed border-border hover:border-accent/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 min-h-[300px] group hover:bg-accent/5 transition-all duration-300"
                  >
                    <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Plus className="w-7 h-7 text-accent" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-accent transition-colors">
                      Add New Certification
                    </span>
                  </motion.button>
                </DialogTrigger>
                
                <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Certification</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Certification Name</label>
                      <Input
                        placeholder="e.g., CISSP"
                        value={newCert.name}
                        onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Logo</label>
                      <div className="flex gap-3">
                        {uploadedLogo && (
                          <div className="w-16 h-16 rounded-lg border-2 border-accent overflow-hidden">
                            <img src={uploadedLogo} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <label className="flex-1 cursor-pointer">
                          <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-accent/50 transition-colors flex items-center justify-center gap-2">
                            <Upload className="w-5 h-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {uploadedLogo ? "Change Logo" : "Upload Logo"}
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Credential ID (optional)</label>
                      <Input
                        placeholder="e.g., CERT-2024-XXX"
                        value={newCert.credentialId}
                        onChange={(e) => setNewCert({ ...newCert, credentialId: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Issue Date (optional)</label>
                        <Input
                          placeholder="e.g., Jan 2024"
                          value={newCert.issueDate}
                          onChange={(e) => setNewCert({ ...newCert, issueDate: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Expiration (optional)</label>
                        <Input
                          placeholder="e.g., Jan 2027"
                          value={newCert.expirationDate}
                          onChange={(e) => setNewCert({ ...newCert, expirationDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCert} disabled={!newCert.name || !newCert.logo}>
                      Add Certification
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
