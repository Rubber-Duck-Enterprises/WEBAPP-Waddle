# Guía del Sistema de Alertas — Waddle

Documentación para extraer y reutilizar el sistema de alertas de Waddle como librería independiente.

---

## Arquitectura General

El proyecto maneja alertas en **2 capas** independientes:

| Capa | Componente | Propósito |
|------|-----------|-----------|
| **PopUp (Toast)** | `PopUpContext` + `<PopUp />` | Notificaciones rápidas, auto-dismiss |
| **Modal** | `ModalContext` + `<Modal />` | Diálogos de confirmación, formularios |

---

## 1. Sistema PopUp (Toasts)

### Concepto
Notificaciones tipo toast que aparecen en la esquina superior derecha, se auto-cierran en 4.5s, y soportan máximo 3 simultáneas.

### Variantes

```typescript
type PopUpVariant = "SUCCESS" | "DANGER" | "INFO";
```

Cada variante tiene su propio icono, color de fondo y borde definidos por CSS variables:

| Variante | Icono | Background var | Border var |
|----------|-------|---------------|------------|
| SUCCESS | 🎉 | `--success-bg-popup` | `--success-color` |
| DANGER | 💥 | `--danger-bg-popup` | `--danger-color` |
| INFO | ℹ️ | `--information-bg-popup` | `--information-color` |

### Estructura del Context

```typescript
// PopUpContext.tsx
type PopUpItem = {
  id: string;
  variant: PopUpVariant;
  content: string;
  createdAt: number;
};

interface PopUpContextProps {
  showPopUp: (variant: PopUpVariant, content: string) => string; // retorna id
  hidePopUp: (id: string) => void;
  clearAll: () => void;
  items: PopUpItem[];
}
```

El `PopUpProvider` envuelve la app y expone `showPopUp`, `hidePopUp`, y `clearAll` via el hook `usePopUp()`.

### Componente Visual (`<PopUp />`)

- Usa `createPortal` para renderizar en `document.body`
- Animaciones con `framer-motion` (AnimatePresence + motion.div)
- Posición fija: `top: calc(16px + var(--safe-area-top))`, `right: 16px`, `z-index: 3000`
- Auto-cierre: cada toast se elimina después de `autoCloseMs` (default 4500ms)
- Límite: si hay más de 3 toasts, el más antiguo se elimina automáticamente

### Uso típico

```tsx
const { showPopUp } = usePopUp();

// Éxito
showPopUp("SUCCESS", "Tarea creada!");

// Error
showPopUp("DANGER", "Error al crear tarea.");

// Validación
showPopUp("DANGER", "Escribe una descripción.");

// Informativo
showPopUp("INFO", "El balance es igual al actual, no hay cambios.");
```

### Patrones de uso en el proyecto

1. **Validación de formularios**: antes de enviar, se validan campos y se muestra DANGER si falta algo
2. **Confirmación de acción exitosa**: después de crear/editar/eliminar algo → SUCCESS
3. **Manejo de errores en catch**: si algo falla → DANGER con mensaje genérico
4. **Feedback informativo**: cuando no hay cambios reales → INFO

---

## 2. Sistema Modal

### Concepto
Diálogos centrados con backdrop blur, para confirmaciones, formularios y flujos que requieren interacción del usuario.

### Estructura del Context

```typescript
// ModalContext.tsx
interface ModalContextProps {
  showModal: (content: ReactNode) => void;
  hideModal: () => void;
  content: ReactNode | null;
  isOpen: boolean;
}
```

El modal acepta **cualquier ReactNode** como contenido — no hay un schema rígido de props. Esto lo hace muy flexible.

### Componente Visual (`<Modal />`)

- `createPortal` en `document.body`
- Backdrop: `rgba(0,0,0,0.4)` con `backdrop-filter: blur(8px)`, `z-index: 1000`
- Contenido: `z-index: 1001`, centrado con flex, animado con framer-motion
- Click en backdrop → `hideModal()`
- Estilos del contenedor: `padding: 24px`, `border-radius: 12px`, `max-width: 90vw`, `max-height: 90vh`

### Patrón de Presets

Los modales se organizan en "presets" — funciones factory que retornan JSX:

```typescript
// Patrón: función getter que retorna el componente
export const getDeleteSectionModal = ({ sectionName, onConfirm, onCancel }: Props) => {
  return <DeleteSectionModal sectionName={sectionName} onConfirm={onConfirm} onCancel={onCancel} />;
};
```

Uso:
```tsx
const { showModal, hideModal } = useModal();

showModal(
  getDeleteSectionModal({
    sectionName: "Ahorros",
    onConfirm: () => { /* lógica */ },
    onCancel: hideModal,
  })
);
```

### Catálogo de Presets existentes

**Account:**
- `MigrateAnonDataModal` — Migrar datos de sesión anónima al login

**List (Tareas):**
- `CreateTaskModal` — Crear tarea con título, notas, etiquetas, lista
- `CreateTaskListModal` — Crear nueva lista de tareas
- `DeleteTaskListModal` — Confirmar eliminación de lista
- `EditTaskModal` — Editar tarea existente
- `TasksDeletedModal` — Confirmación de tareas eliminadas

**System:**
- `DeleteAllDataModal` — Borrar todos los datos
- `ImportSuccessModal` — Importación exitosa (recarga página)
- `NotificationsRequestModal` — Solicitar permisos de notificación
- `SavedSettingsModal` — Confirmación de settings guardados

**Wallet:**
- `AddExpenseModal` — Agregar gasto
- `AddIncomeModal` — Agregar ingreso
- `AddCreditCardExpenseModal` — Gasto en tarjeta de crédito
- `AdjustBalanceModal` — Ajustar balance
- `ConfirmDeleteMovmentModal` — Confirmar eliminación de movimiento
- `CreateSectionModal` — Crear apartado financiero
- `DeleteSectionModal` — Eliminar apartado (con confirmación por texto)
- `EditSectionModal` — Editar apartado
- `EditExpenseModal` — Editar movimiento
- `PayCreditCardModal` — Pagar tarjeta de crédito
- `TransferFundsModal` — Transferir fondos entre apartados

### Estructura interna de un Preset

Todos los presets siguen este patrón:

```tsx
// 1. Props tipadas
type Props = {
  onConfirm: () => void;
  onCancel: () => void;
};

// 2. Función factory (getter)
export const getMyModal = (props: Props) => <MyModal {...props} />;

// 3. Componente interno
const MyModal: React.FC<Props> = ({ onConfirm, onCancel }) => {
  const { showPopUp } = usePopUp(); // para feedback después de la acción

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3>Título con emoji</h3>
      <p style={{ color: "var(--text-secondary)" }}>Descripción</p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <UIButton onClick={onCancel} variant="default">Cancelar</UIButton>
        <UIButton onClick={() => {
          try {
            onConfirm();
            showPopUp("SUCCESS", "Acción completada.");
          } catch (error) {
            showPopUp("DANGER", "Error al realizar la acción.");
          }
        }} variant="primary">Confirmar</UIButton>
      </div>
    </div>
  );
};
```

---

## 3. CSS Variables (Theming)

Variables relevantes para la librería:

```css
/* Colores semánticos */
--success-color: #4caf50;
--danger-color: #f44336;
--information-color: #2196f3;

/* Fondos para PopUps (con transparencia) */
--success-bg-popup: #4caf4f36;
--danger-bg-popup: #f4433636;
--information-bg-popup: #2196f336;

/* Fondos para badges/tags */
--success-bg: #4caf501a;
--danger-bg: #f443361a;
--information-bg: #2196f31a;

/* Generales */
--background: #ffffff;
--text-primary: #000000;
--text-secondary: #777777;

/* Botones */
--btn-default-bg: #ccc;
--btn-primary-bg: var(--success-color);
--btn-secondary-bg: #2196f3;
--btn-danger-bg: var(--danger-color);
--btn-text-color: #ffffff;
```

El proyecto soporta dark mode invirtiendo estas variables.

---

## 4. Dependencias necesarias para la librería

| Paquete | Versión | Uso |
|---------|---------|-----|
| `react` | ^19.0.0 | Core |
| `react-dom` | ^19.0.0 | createPortal |
| `framer-motion` | ^12.9.4 | Animaciones de entrada/salida |

---

## 5. Guía para extraer como librería

### Componentes a extraer

```
libreria-alertas/
├── src/
│   ├── PopUp/
│   │   ├── PopUpContext.tsx      ← context + provider + hook
│   │   └── PopUp.tsx             ← componente visual (toasts)
│   ├── Modal/
│   │   ├── ModalContext.tsx       ← context + provider + hook
│   │   └── Modal.tsx             ← componente visual (backdrop + contenedor)
│   ├── theme/
│   │   └── variables.css         ← CSS variables por defecto
│   └── index.ts                  ← exports públicos
├── package.json
└── README.md
```

### API pública sugerida

```typescript
// Exports
export { PopUpProvider, usePopUp } from './PopUp/PopUpContext';
export { PopUp } from './PopUp/PopUp';
export { ModalProvider, useModal } from './Modal/ModalContext';
export { Modal } from './Modal/Modal';
export type { PopUpVariant, PopUpItem } from './PopUp/PopUpContext';
```

### Integración en proyecto consumidor

```tsx
import { ModalProvider, PopUpProvider, Modal, PopUp } from '@rbduck/alertas';
import '@rbduck/alertas/theme/variables.css'; // o definir tus propias variables

createRoot(document.getElementById('root')!).render(
  <ModalProvider>
    <PopUpProvider>
      <App />
      <Modal />
      <PopUp />
    </PopUpProvider>
  </ModalProvider>
);
```

### Consideraciones para la librería

1. **No incluir presets** — los presets son específicos de Waddle. La librería solo expone los sistemas base (Modal + PopUp)
2. **CSS variables configurables** — proveer defaults pero permitir override
3. **framer-motion como peer dependency** — para no duplicar el bundle
4. **Safe area** — exponer `--safe-area-top` como variable configurable para apps móviles
5. **Límite de toasts configurable** — actualmente hardcoded a 3, hacerlo prop del Provider
6. **autoCloseMs configurable** — actualmente 4500ms, hacerlo prop del componente o del Provider
