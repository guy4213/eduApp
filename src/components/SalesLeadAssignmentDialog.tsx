import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const salesLeadSchema = z.object({
  institution_name: z.string().min(1, "שם מוסד הוא שדה חובה"),
  instructor_id: z.string().min(1, "יש לבחור מדריך"),
  contact_person: z.string().min(1, "שם איש קשר הוא שדה חובה"),
  contact_phone: z.string().min(1, "טלפון איש קשר הוא שדה חובה"),
  email: z
    .string()
    .min(1, "      כתוב מייל")
    .email("יש להכניס כתובת מייל תקינה"),
  address: z.string().min(6, " הקש כתובת "),
  status: z.string().min(1, "יש לבחור סטטוס"),
  potential_value: z.number().min(0, "ערך פוטנציאלי חייב להיות חיובי"),
  commission_percentage: z
    .number()
    .min(0)
    .max(100, "אחוז עמלה חייב להיות בין 0 ל-100"),
  target_date: z.date().optional(),
  notes: z.string().optional(),
});

type SalesLeadFormData = z.infer<typeof salesLeadSchema>;

interface Instructor {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
}

interface Institution {
  id: string;
  name: string;
  contact_person: string | null;
  contact_phone: string | null;
  address: string | null;
  contact_email: string | null;
}


interface SalesLeadAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadCreated?: () => void;
}

const leadStatuses = [
  { value: "new", label: "חדש" },
  { value: "contacted", label: "נוצר קשר" },
  { value: "meeting_scheduled", label: "נקבעה פגישה" },
  { value: "proposal_sent", label: "נשלחה הצעה" },
  { value: "negotiation", label: "במשא ומתן" },
  { value: "follow_up", label: "מעקב" },
  { value: "closed_won", label: "נסגר - זכייה" },
  { value: "closed_lost", label: "נסגר - הפסד" },
];

export default function SalesLeadAssignmentDialog({
  open,
  onOpenChange,
  onLeadCreated,
}: SalesLeadAssignmentDialogProps) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<SalesLeadFormData>({
    resolver: zodResolver(salesLeadSchema),
  defaultValues: {
  institution_name: "",
  instructor_id: "",
  contact_person: "",
  contact_phone: "",
  email: "",
  address: "",
  status: "new",
  potential_value: 0,
  commission_percentage: 10,
  notes: "",
},
  });

  useEffect(() => {
    if (open) {
      fetchInstructors();
      fetchInstitutions();
    }
  }, [open]);

  const fetchInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .eq("role", "instructor")
        .order("full_name");

      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error("Error fetching instructors:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את רשימת המדריכים",
        variant: "destructive",
      });
    }
  };

  const fetchInstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from("educational_institutions")
      .select("id, name, contact_person, contact_phone, address, contact_email")
        .order("name");

      if (error) throw error;
      setInstitutions(data || []);
    } catch (error) {
      console.error("Error fetching institutions:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את רשימת המוסדות",
        variant: "destructive",
      });
    }
  };

  const onSelectInstitution = (institutionId: string) => {
    const institution = institutions.find((inst) => inst.id === institutionId);
    if (institution) {
      form.setValue("institution_name", institution.name);
      if (institution.contact_person) {
        form.setValue("contact_person", institution.contact_person);
      }
      if (institution.contact_phone) {
        form.setValue("contact_phone", institution.contact_phone);
      }
      if (institution.address) {
        form.setValue("address", institution.address);
      }
      if (institution.contact_email) {
        form.setValue("email", institution.contact_email);
      }
    }
  };

  const checkAndCreateInstitution = async (data: SalesLeadFormData) => {
    try {
      // Check if institution already exists
      const { data: existingInstitution, error: checkError } = await supabase
        .from("educational_institutions")
        .select("id, name")
        .eq("name", data.institution_name)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is "not found" error, which is expected if institution doesn't exist
        throw checkError;
      }

      // If institution exists, return it
      if (existingInstitution) {
        return existingInstitution;
      }

      // If institution doesn't exist, create it
      const { data: newInstitution, error: createError } = await supabase
        .from("educational_institutions")
        .insert([
          {
            name: data.institution_name,
            address: data.address,
            contact_person: data.contact_person,
            contact_phone: data.contact_phone,
            contact_email: data.email,
          },
        ])
        .select("id, name")
        .single();

      if (createError) throw createError;

      return newInstitution;
    } catch (error) {
      console.error("Error checking/creating institution:", error);
      throw error;
    }
  };

  const onSubmit = async (data: SalesLeadFormData) => {
    setIsSubmitting(true);
    try {
      // Check and create institution if it doesn't exist

      const leadData = {
        institution_name: data.institution_name,
        instructor_id: data.instructor_id,
        contact_person: data.contact_person,
        contact_phone: data.contact_phone,
        status: data.status,
        potential_value: data.potential_value,
        commission_percentage: data.commission_percentage,
        notes: data.notes,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("sales_leads").insert([leadData]);

      if (error) throw error;
      await checkAndCreateInstitution(data);
      toast({
        title: "הוקצה ליד בהצלחה",
        description: "ליד המכירות נוצר ונשמר במערכת",
      });

      // Refresh institutions list to include the newly created one
      fetchInstitutions();

      form.reset();
      onOpenChange(false);
      onLeadCreated?.();
    } catch (error) {
      console.error("Error creating sales lead:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן ליצור את ליד המכירות",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-right">
            הקצאת ליד למדריך
          </DialogTitle>
          <DialogDescription className="text-right">
            מלא את הפרטים להקצאת ליד מכירות למדריך
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Institution Selection */}
              <FormField
                control={form.control}
                name="institution_name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>שם מוסד</FormLabel>
                    <div className="flex gap-2">
                      <FormControl className="flex-1">
                        <Input
                          placeholder="הכנס שם מוסד או בחר מהרשימה"
                          {...field}
                          className="text-right"
                        />
                      </FormControl>
                      <Select onValueChange={onSelectInstitution}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="בחר מוסד" />
                        </SelectTrigger>
                        <SelectContent>
                          {institutions.map((institution) => (
                            <SelectItem
                              key={institution.id}
                              value={institution.id}
                            >
                              {institution.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Instructor Selection */}
              <FormField
                control={form.control}
                name="instructor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מדריך</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר מדריך" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {instructors.map((instructor) => (
                          <SelectItem key={instructor.id} value={instructor.id}>
                            <div className="text-right">
                              <div>{instructor.full_name}</div>
                              {instructor.phone && (
                                <div className="text-sm text-gray-500">
                                  {instructor.phone}
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סטטוס נוכחי בליד</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר סטטוס" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>דוא"ל של איש הקשר</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="example@email.com"
                        {...field}
                        className="text-right"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>כתובת המוסד</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="רחוב, עיר..."
                        {...field}
                        className="text-right"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Person */}
              <FormField
                control={form.control}
                name="contact_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם איש קשר במוסד</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="שם איש הקשר"
                        {...field}
                        className="text-right"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Phone */}
              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>טלפון של איש קשר</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="050-1234567"
                        {...field}
                        className="text-right"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Potential Value */}
              <FormField
                control={form.control}
                name="potential_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תגמול פוטנציאלי (₪)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="text-right"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Commission Percentage */}
              <FormField
                control={form.control}
                name="commission_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>אחוז עמלה (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10"
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="text-right"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Target Date */}
              <FormField
                control={form.control}
                name="target_date"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>תאריך יעד להמשך פעולה</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-right font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: he })
                            ) : (
                              <span>בחר תאריך</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>הערות פנימיות</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="הערות נוספות על הליד..."
                        className="resize-none text-right"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    שומר...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    צור ליד
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
