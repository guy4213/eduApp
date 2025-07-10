import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Edit, Save, X } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birthdate: string | null;
  hourly_rate: number | null;
  current_work_hours: number | null;
  benefits: string | null;
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    phone: ''
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        toast({
          title: "שגיאה",
          description: "לא ניתן לטעון את הפרופיל",
          variant: "destructive",
        });
        return;
      }

      setProfile(data);
      setEditForm({
        email: data.email || '',
        phone: data.phone || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditForm({
      email: profile?.email || '',
      phone: profile?.phone || ''
    });
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          email: editForm.email || null,
          phone: editForm.phone || null
        })
        .eq('id', user.id);

      if (error) {
        toast({
          title: "שגיאה",
          description: "לא ניתן לעדכן את הפרופיל",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setProfile({
        ...profile,
        email: editForm.email || null,
        phone: editForm.phone || null
      });

      setEditing(false);
      toast({
        title: "הפרופיל עודכן בהצלחה",
        description: "השינויים נשמרו במערכת",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון הפרופיל",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>לא נמצא פרופיל</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">פרופיל אישי</CardTitle>
          {!editing && (
            <Button onClick={handleEdit} variant="outline" size="sm">
              <Edit className="h-4 w-4 ml-2" />
              עריכה
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name - Read only */}
            <div>
              <Label htmlFor="name">שם מלא</Label>
              <Input
                id="name"
                value={profile.full_name}
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* Email - Editable */}
            <div>
              <Label htmlFor="email">אימייל</Label>
              {editing ? (
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              ) : (
                <Input
                  id="email"
                  value={profile.email || 'לא הוזן'}
                  disabled
                  className="bg-gray-50"
                />
              )}
            </div>

            {/* Phone - Editable */}
            <div>
              <Label htmlFor="phone">טלפון</Label>
              {editing ? (
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              ) : (
                <Input
                  id="phone"
                  value={profile.phone || 'לא הוזן'}
                  disabled
                  className="bg-gray-50"
                />
              )}
            </div>

            {/* Birthdate - Read only */}
            <div>
              <Label htmlFor="birthdate">תאריך לידה</Label>
              <Input
                id="birthdate"
                value={profile.birthdate ? new Date(profile.birthdate).toLocaleDateString('he-IL') : 'לא הוזן'}
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* Hourly Rate - Read only */}
            <div>
              <Label htmlFor="hourly_rate">תעריף שעתי</Label>
              <Input
                id="hourly_rate"
                value={profile.hourly_rate ? `₪${profile.hourly_rate}` : 'לא הוזן'}
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* Current Work Hours - Read only */}
            <div>
              <Label htmlFor="work_hours">שעות עבודה נוכחיות</Label>
              <Input
                id="work_hours"
                value={profile.current_work_hours || 0}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* Benefits - Read only, full width */}
          <div>
            <Label htmlFor="benefits">תגמולים</Label>
            <Input
              id="benefits"
              value={profile.benefits || 'לא הוזן'}
              disabled
              className="bg-gray-50"
            />
          </div>

          {/* Action buttons when editing */}
          {editing && (
            <div className="flex justify-end space-x-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={saving}
              >
                <X className="h-4 w-4 ml-2" />
                ביטול
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <Save className="h-4 w-4 ml-2" />
                )}
                שמירה
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;