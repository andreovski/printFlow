'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileBodySchema, changePasswordBodySchema } from '@magic-system/schemas';
import { Loader2, Moon, Sun, Monitor, User, Lock, Check, Type } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useAppContext } from '@/app/hooks/useAppContext';
import { updateProfile, changePassword } from '@/app/http/requests/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn } from '@/lib/utils';

import { FONTS, FONT_STORAGE_KEY, applyFont } from './font-provider';
import {
  PRIMARY_COLORS,
  PRIMARY_COLOR_STORAGE_KEY,
  applyPrimaryColor,
} from './primary-color-provider';
import { ResponsiveDrawer } from './responsive-drawer';
import {
  COMPLETE_THEMES,
  THEME_STORAGE_KEY,
  THEME_ENABLED_KEY,
  applyCompleteTheme,
  removeCompleteTheme,
} from './theme-color-provider';

type UpdateProfileFormData = z.infer<typeof updateProfileBodySchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordBodySchema>;

interface ProfileDrawerProps {
  trigger: React.ReactNode;
}

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Fraca', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Razoável', color: 'bg-orange-500' };
  if (score <= 3) return { score, label: 'Boa', color: 'bg-yellow-500' };
  if (score <= 4) return { score, label: 'Forte', color: 'bg-green-500' };
  return { score, label: 'Muito Forte', color: 'bg-emerald-500' };
}

export function ProfileDrawer({ trigger }: ProfileDrawerProps) {
  const { user } = useAppContext();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [primaryColor, setPrimaryColor] = useLocalStorage(PRIMARY_COLOR_STORAGE_KEY, 'cyan');
  const [completeTheme, setCompleteTheme] = useLocalStorage(THEME_STORAGE_KEY, 'ambar');
  const [themeEnabled, setThemeEnabled] = useLocalStorage(THEME_ENABLED_KEY, false);
  const [font, setFont] = useLocalStorage(FONT_STORAGE_KEY, 'josefins');

  const [floatingMenuEnabled, setFloatingMenuEnabled] = useLocalStorage(
    'floating-menu-enabled',
    true
  );
  const drawer = useDisclosure();

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Aplicar cor ou tema completo
  useEffect(() => {
    if (mounted) {
      if (themeEnabled) {
        applyCompleteTheme(completeTheme, resolvedTheme);
      } else {
        removeCompleteTheme();
        applyPrimaryColor(primaryColor, resolvedTheme);
      }
    }
  }, [mounted, primaryColor, completeTheme, themeEnabled, resolvedTheme]);

  const handleColorChange = (colorValue: string) => {
    setPrimaryColor(colorValue);
  };

  const handleThemeChange = (themeValue: string) => {
    setCompleteTheme(themeValue);
  };

  const handleThemeToggle = (enabled: boolean) => {
    setThemeEnabled(enabled);
  };

  const handleFontChange = (fontValue: string) => {
    setFont(fontValue);
  };

  // Apply font when it changes
  useEffect(() => {
    if (mounted) {
      applyFont(font);
    }
  }, [mounted, font]);

  // Profile form
  const profileForm = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileBodySchema),
    defaultValues: {
      name: user?.name || '',
    },
  });

  // Reset form when user data changes
  useEffect(() => {
    if (user?.name) {
      profileForm.reset({ name: user.name });
    }
  }, [user?.name, profileForm]);

  // Password form
  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordBodySchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = passwordForm.watch('newPassword');
  const passwordStrength = getPasswordStrength(newPassword || '');

  const handleUpdateProfile = async (data: UpdateProfileFormData) => {
    try {
      await updateProfile(data);
      toast.success('Perfil atualizado com sucesso!');
      // Reload page to update user data in context
      window.location.reload();
    } catch (_error) {
      toast.error('Erro ao atualizar perfil. Tente novamente.');
    }
  };

  const handleChangePassword = async (data: ChangePasswordFormData) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Senha alterada com sucesso!');
      passwordForm.reset();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erro ao alterar senha. Tente novamente.';
      toast.error(message);
    }
  };

  return (
    <>
      <div onClick={() => drawer.open()}>{trigger}</div>

      <ResponsiveDrawer
        open={drawer.isOpen}
        onOpenChange={(open) => {
          if (!open) drawer.close();
        }}
        title="Configurações de Perfil"
        description="Gerencie suas informações pessoais e preferências"
        headerIcon={<User className="h-5 w-5" />}
        className="sm:max-w-lg"
      >
        <div className="space-y-6 p-6">
          {/* Profile Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Informações Pessoais</h3>
            </div>

            <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" placeholder="Seu nome" {...profileForm.register('name')} />
                {profileForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
              </div>

              <Button
                type="submit"
                disabled={profileForm.formState.isSubmitting}
                className="w-full"
              >
                {profileForm.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar Alterações
              </Button>
            </form>
          </div>

          <Separator />

          {/* Password Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Alterar Senha</h3>
            </div>

            <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  {...passwordForm.register('currentPassword')}
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  {...passwordForm.register('newPassword')}
                />
                {newPassword && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={cn(
                            'h-1.5 flex-1 rounded-full transition-colors',
                            level <= passwordStrength.score ? passwordStrength.color : 'bg-muted'
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Força da senha: {passwordStrength.label}
                    </p>
                  </div>
                )}
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...passwordForm.register('confirmPassword')}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="secondary"
                disabled={passwordForm.formState.isSubmitting}
                className="w-full"
              >
                {passwordForm.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Alterar Senha
              </Button>
            </form>
          </div>

          <Separator />

          {/* Theme Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Aparência</h3>
            </div>

            <div className="space-y-2">
              <Label>Tema</Label>
              {mounted && (
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        <span>Claro</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        <span>Escuro</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        <span>Sistema</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                Escolha como você prefere visualizar o sistema
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Tema Completo</Label>
                <button
                  type="button"
                  onClick={() => handleThemeToggle(!themeEnabled)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    themeEnabled ? 'bg-primary' : 'bg-input'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-background transition-transform',
                      themeEnabled ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
              {mounted && themeEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  {COMPLETE_THEMES.map((themeItem) => {
                    const isSelected = completeTheme === themeItem.value;
                    const preview =
                      resolvedTheme === 'dark' ? themeItem.preview.dark : themeItem.preview.light;

                    return (
                      <button
                        key={themeItem.value}
                        type="button"
                        onClick={() => handleThemeChange(themeItem.value)}
                        className={cn(
                          'group relative flex flex-col gap-2 rounded-lg border-2 p-3 transition-all hover:shadow-md',
                          isSelected
                            ? 'border-primary shadow-sm'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{themeItem.name}</span>
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="flex gap-1.5">
                          <div
                            className="h-6 flex-1 rounded border"
                            style={{ backgroundColor: preview.background }}
                          />
                          <div
                            className="h-6 flex-1 rounded border"
                            style={{ backgroundColor: preview.primary }}
                          />
                          <div
                            className="h-6 flex-1 rounded border"
                            style={{ backgroundColor: preview.border }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-left">
                          {themeItem.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {themeEnabled
                  ? 'Tema completo altera todas as cores do sistema'
                  : 'Ative para usar temas completos ao invés de cores primárias'}
              </p>
            </div>

            {!themeEnabled && (
              <div className="space-y-2">
                <Label>Cor Primária</Label>
                {mounted && (
                  <div className="grid grid-cols-5 gap-2">
                    {PRIMARY_COLORS.map((color) => {
                      const isSelected = primaryColor === color.value;
                      const previewClass =
                        resolvedTheme === 'dark' ? color.preview.dark : color.preview.light;

                      return (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => handleColorChange(color.value)}
                          className={cn(
                            'group relative flex h-10 w-full items-center justify-center rounded-md transition-all',
                            previewClass,
                            isSelected
                              ? 'ring-2 ring-offset-2 ring-offset-background'
                              : 'hover:scale-105 hover:shadow-md'
                          )}
                          title={color.name}
                        >
                          {isSelected && <Check className="h-4 w-4 text-white drop-shadow-md" />}
                          <span className="sr-only">{color.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Personalize a cor principal do sistema
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Typography Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Tipografia</h3>
            </div>

            <div className="space-y-2">
              <Label>Fonte</Label>
              {mounted && (
                <div className="grid grid-cols-3 gap-2">
                  {FONTS.map((fontItem) => {
                    const isSelected = font === fontItem.value;

                    return (
                      <button
                        key={fontItem.value}
                        type="button"
                        onClick={() => handleFontChange(fontItem.value)}
                        className={cn(
                          'group relative flex flex-col items-center justify-center gap-1 rounded-md border p-2 transition-all hover:shadow-md',
                          isSelected
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <span className={cn('text-lg', fontItem.class)}>Aa</span>
                        <span className="text-xs font-medium">{fontItem.name}</span>
                        {isSelected && (
                          <div className="absolute right-1 top-1">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Escolha a fonte que melhor se adapta ao seu estilo
              </p>
            </div>
          </div>

          <Separator />

          {/* Interface Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Interface</h3>
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="floating-menu">Menu de Ações Rápido</Label>
                <p className="text-xs text-muted-foreground">
                  Habilita o botão flutuante no canto da tela
                </p>
              </div>
              <Switch
                id="floating-menu"
                checked={floatingMenuEnabled}
                onCheckedChange={setFloatingMenuEnabled}
              />
            </div>
          </div>
        </div>
      </ResponsiveDrawer>
    </>
  );
}
