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
  const [editingCert, setEditingCert] = useState<string | null>(null);
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
        expirationDate: cert.expiration_date ? new Date(cert.expiration_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ""
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
    if (!newCert.name || !newCert.logo || !newCert.issueDate) {
      toast.error("Please fill in name, logo, and issue date");
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Convert issueDate to YYYY-MM-DD format
    let dateValue = newCert.issueDate;
    if (!dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Try to parse common formats like "Jan 2024"
      try {
        const parsedDate = new Date(newCert.issueDate);
        if (!isNaN(parsedDate.getTime())) {
          dateValue = parsedDate.toISOString().split('T')[0];
        } else {
          toast.error("Please enter a valid date");
          return;
        }
      } catch {
        toast.error("Please enter a valid date");
        return;
      }
    }

    // Convert expirationDate to YYYY-MM-DD format if provided
    let expirationDateValue = null;
    if (newCert.expirationDate) {
      if (newCert.expirationDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        expirationDateValue = newCert.expirationDate;
      } else {
        try {
          const parsedExpDate = new Date(newCert.expirationDate);
          if (!isNaN(parsedExpDate.getTime())) {
            expirationDateValue = parsedExpDate.toISOString().split('T')[0];
          }
        } catch {
          // If expiration date is invalid, just skip it
          expirationDateValue = null;
        }
      }
    }

    if (editingCert) {
      // Update existing certification
      const { error } = await supabase
        .from('certifications')
        .update({
          name: newCert.name,
          image_url: newCert.logo,
          credential_url: newCert.credentialId,
          date: dateValue,
          expiration_date: expirationDateValue,
          issuer: "Certification Issuer"
        })
        .eq('user_id', user.id)
        .eq('name', editingCert);

      if (error) {
        toast.error("Failed to update certification");
        console.error('Error updating certification:', error);
        return;
      }

      await fetchCertifications();
      toast.success("Certification updated successfully");
    } else {
      // Insert new certification
      const { error } = await supabase
        .from('certifications')
        .insert({
          user_id: user.id,
          name: newCert.name,
          issuer: "Certification Issuer",
          date: dateValue,
          expiration_date: expirationDateValue,
          image_url: newCert.logo,
          credential_url: newCert.credentialId
        });

      if (error) {
        toast.error("Failed to add certification");
        console.error('Error adding certification:', error);
        return;
      }

      await fetchCertifications();
      toast.success("Certification added successfully");
    }
    
    setNewCert({ name: "", logo: "", credentialId: "", issueDate: "", expirationDate: "" });
    setUploadedLogo("");
    setEditingCert(null);
    setIsAddDialogOpen(false);
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
            <h2 className="text-6xl md:text-7xl font-bold font-sans bg-gradient-cyber bg-clip-text text-transparent">
              Certifications
            </h2>
            <div className="w-32 h-1.5 bg-gradient-cyber mx-auto rounded-full shadow-glow" />
          </div>

          {/* Hexagonal Grid Layout - Unique & Eye-catching */}
          <div className="relative max-w-6xl mx-auto">
            {/* Main certification showcase */}
            <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
              {certifications.map((cert, index) => (
                <motion.div
                  key={cert.name}
                  initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ 
                    delay: index * 0.15, 
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100
                  }}
                  viewport={{ once: true }}
                  className="group relative"
                  style={{
                    perspective: "1000px"
                  }}
                >
                  {/* Hexagonal shape container */}
                  <div className="relative w-72 min-h-[20rem]">
                    {/* Animated glow background */}
                    <motion.div
                      className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent/20 via-primary/20 to-accent/20 blur-2xl"
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: index * 0.5
                      }}
                    />
                    
                    {/* Main card with 3D effect */}
                    <motion.div
                      className="relative h-full bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl border-2 border-accent/30 rounded-3xl p-8 shadow-2xl overflow-visible"
                      whileHover={{ 
                        rotateY: 5,
                        rotateX: 5,
                        scale: 1.05,
                        borderColor: "hsl(var(--accent) / 0.6)"
                      }}
                      transition={{ duration: 0.3 }}
                      style={{
                        transformStyle: "preserve-3d"
                      }}
                    >
                      {/* Animated circuit pattern overlay */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-4 right-4 w-32 h-32 border border-accent rounded-full" />
                        <div className="absolute bottom-4 left-4 w-24 h-24 border border-primary rounded-full" />
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-accent/50" 
                          style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} 
                        />
                      </div>

                      {isOwner && (
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-20">
                          <button
                            onClick={() => {
                              setEditingCert(cert.name);
                              setNewCert({
                                name: cert.name,
                                logo: cert.logo,
                                credentialId: cert.credentialId,
                                issueDate: cert.issueDate,
                                expirationDate: cert.expirationDate
                              });
                              setUploadedLogo(cert.logo);
                              setIsAddDialogOpen(true);
                            }}
                            className="bg-primary/20 hover:bg-primary/30 text-primary rounded-xl p-2.5 backdrop-blur-sm"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                          </button>
                          <button
                            onClick={() => handleRemoveCert(cert.name)}
                            className="bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-xl p-2.5 backdrop-blur-sm"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      
                      <div className="relative z-10 h-full flex flex-col items-center justify-between text-center">
                        {/* Logo with holographic effect */}
                        <motion.div 
                          className="relative"
                          whileHover={{ scale: 1.1, rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <div className="w-24 h-24 flex items-center justify-center bg-gradient-to-br from-accent/20 to-primary/20 rounded-2xl border-2 border-accent/40 shadow-glow relative overflow-hidden">
                            {/* Scanning light effect */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/30 to-transparent"
                              animate={{
                                y: ["-100%", "200%"]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 1,
                                ease: "linear"
                              }}
                            />
                            {cert.logo.startsWith('data:') ? (
                              <img src={cert.logo} alt={cert.name} className="w-16 h-16 object-contain relative z-10" />
                            ) : (
                              <span className="text-5xl relative z-10">{cert.logo}</span>
                            )}
                          </div>
                        </motion.div>

                        {/* Certification name with gradient */}
                        <div className="space-y-3 flex-1 flex flex-col justify-center">
                          <h3 className="text-2xl font-bold bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent leading-tight px-2">
                            {cert.name}
                          </h3>
                          
                          {/* Divider line */}
                          <motion.div 
                            className="w-16 h-1 bg-gradient-to-r from-transparent via-accent to-transparent mx-auto rounded-full"
                            animate={{
                              width: ["64px", "96px", "64px"]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                        </div>

                        {/* Info section with better spacing */}
                        <div className="space-y-2.5 w-full">
                          {cert.credentialId && (
                            <div className="bg-accent/10 backdrop-blur-sm rounded-xl p-3 border border-accent/20">
                              <p className="text-xs text-accent/80 font-semibold mb-1">CREDENTIAL ID</p>
                              <p className="font-mono text-xs text-foreground/90 break-all">{cert.credentialId}</p>
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

                        {/* Corner accents */}
                        <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-accent/40 rounded-tl-lg" />
                        <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-accent/40 rounded-tr-lg" />
                        <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-primary/40 rounded-bl-lg" />
                        <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-primary/40 rounded-br-lg" />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ))}

              {/* Add Certification Button - Owner Only */}
              {isOwner && (
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: certifications.length * 0.15, duration: 0.6 }}
                      viewport={{ once: true }}
                      className="relative w-72 h-80 border-2 border-dashed border-accent/30 hover:border-accent/60 rounded-3xl flex flex-col items-center justify-center gap-6 group hover:bg-accent/5 transition-all duration-300"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-all group-hover:scale-110">
                        <Plus className="w-8 h-8 text-accent" />
                      </div>
                      <span className="text-base font-semibold text-muted-foreground group-hover:text-accent transition-colors">
                        Add New Certification
                      </span>
                    </motion.button>
                  </DialogTrigger>
                  
                  <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingCert ? 'Edit' : 'Add New'} Certification</DialogTitle>
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
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Issue Date *</label>
                        <Input
                          type="date"
                          value={newCert.issueDate}
                          onChange={(e) => setNewCert({ ...newCert, issueDate: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Expiration Date (optional)</label>
                        <Input
                          type="date"
                          value={newCert.expirationDate}
                          onChange={(e) => setNewCert({ ...newCert, expirationDate: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddCert} disabled={!newCert.name || !newCert.logo || !newCert.issueDate}>
                        {editingCert ? 'Update Certification' : 'Add Certification'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
