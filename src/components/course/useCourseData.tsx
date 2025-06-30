
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Institution {
  id: string;
  name: string;
}

interface Curriculum {
  id: string;
  name: string;
}

export const useCourseData = () => {
  const { toast } = useToast();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);

  const fetchInstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from('educational_institutions')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setInstitutions(data || []);
    } catch (error) {
      console.error('Error fetching institutions:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את רשימת המוסדות",
        variant: "destructive"
      });
    }
  };

  const fetchCurricula = async () => {
    try {
      const { data, error } = await supabase
        .from('curricula')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setCurricula(data || []);
    } catch (error) {
      console.error('Error fetching curricula:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את רשימת תוכניות הלימודים",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchInstitutions();
    fetchCurricula();
  }, []);

  return {
    institutions,
    curricula,
    fetchInstitutions,
    fetchCurricula
  };
};
