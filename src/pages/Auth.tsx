
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from '@/components/ui/use-toast';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            title: 'שגיאה בהתחברות',
            description: error.message === 'Invalid login credentials' 
              ? 'פרטי התחברות שגויים' 
              : error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'התחברות הושלמה',
            description: 'ברוך הבא למערכת ניהול המנחים',
          });
        }
      } else {
        if (!formData.fullName.trim()) {
          toast({
            title: 'שגיאה',
            description: 'נא למלא שם מלא',
            variant: 'destructive',
          });
          return;
        }
        
        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) {
          toast({
            title: 'שגיאה ברישום',
            description: error.message === 'User already registered' 
              ? 'משתמש כבר רשום במערכת' 
              : error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'הרישום הושלם',
            description: 'נא לבדוק את תיבת המייל לאישור החשבון',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה לא צפויה',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <GraduationCap className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isLogin ? 'התחברות למערכת' : 'רישום למערכת'}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? 'הכנס את פרטיך להתחברות למערכת ניהול המנחים' 
              : 'צור חשבון חדש במערכת ניהול המנחים'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">שם מלא</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="הכנס שם מלא"
                  required={!isLogin}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="example@domain.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="הכנס סיסמה"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'מעבד...' : (isLogin ? 'התחבר' : 'הירשם')}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({ email: '', password: '', fullName: '' });
              }}
              className="text-sm"
            >
              {isLogin 
                ? 'אין לך חשבון? לחץ כאן להרשמה' 
                : 'יש לך כבר חשבון? לחץ כאן להתחברות'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
