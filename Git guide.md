### Guía de como hacer un pull de una branch y hacer tu propia branch para continuar en ella:

En nuestro caso hacemos pull de la rama ``server-actions`` para crear la rama ``prisma-migrates`` y continuar ahí con el proyecto:

```shell
git init # En la carpeta donde queremos ubicar el proyecto
git remote add origin https://github.com/JOlmos98/cti-next-project.git
git remote -v #Para verificar la conexión al repo
git fetch origin #Descarga las ramas sin fusionarlas

#Crea y cambia a una branch local server-actions basada en la del remoto
git checkout -b server-actions origin/server-actions 
git checkout -b prisma-migrates 
#Crea y cambia a la branch prisma-migrates localmente, ahora hacemos algún cambio

git add .
git commit -m "First commit on prisma-migrates."
git push -u origin prisma-migrates #Sube todo a la nueva branch prisma-migrates
```

> [!NOTE]
> -v: verbose
> -b: branch
> -m: message
> -u: upstream
### Guía de cómo hacer pull de un repo, hacer una branch y continuar por esa branch:

```bash
git init
git pull https://github.com/JOlmos98/cti-next-project.git

git branch main
git checkout main
git branch -D master

# Cambiamos algo para hacer un commit y comprobar que todo va bien.
git add .
git commit -m "Cambio de prueba."

git checkout -b server-actions
git push -u [url] server-actions
# Y ya tendriamos en el repo online la rama server-actions y solo hariamos add, commit y push para actualizarla.
```

### Guía de como hacer un pull de una branch y hacer tu propia branch para continuar en ella:

En nuestro caso hacemos pull de la rama ``server-actions`` para crear la rama ``prisma-migrates`` y continuar ahí con el proyecto:

```shell
git init # En la carpeta donde queremos ubicar el proyecto
git remote add origin https://github.com/JOlmos98/cti-next-project.git
git remote -v #Para verificar la conexión al repo
git fetch origin #Descarga las ramas sin fusionarlas

#Crea y cambia a una branch local server-actions basada en la del remoto
git checkout -b server-actions origin/server-actions 
git checkout -b prisma-migrates 
#Crea y cambia a la branch prisma-migrates localmente, ahora hacemos algún cambio

git add .
git commit -m "First commit on prisma-migrates."
git push -u origin prisma-migrates #Sube todo a la nueva branch prisma-migrates
```

> [!NOTE]
> -v: verbose
> -b: branch
> -m: message
> -u: upstream
### Guía de cómo hacer pull de un repo, hacer una branch y continuar por esa branch:

```bash
git init
git pull https://github.com/JOlmos98/cti-next-project.git

git branch main
git checkout main
git branch -D master

# Cambiamos algo para hacer un commit y comprobar que todo va bien.
git add .
git commit -m "Cambio de prueba."

git checkout -b server-actions
git push -u [url] server-actions
# Y ya tendriamos en el repo online la rama server-actions y solo hariamos add, commit y push para actualizarla.
```

### Guía para en un folder vacío hacer pull de una rama específica:

En este caso hay una rama ``backend/verify-emailUser-idUser`` esta rama es hija de ``develop`` y ``develop`` es hija de ``main``. Para traernos la rama ``backend/verify-emailUser-idUser`` directamente a un directorio vacío haremos:

```shell
git init
git remote add origin https://github.com/JOlmos98/cti-invernaderos.git
git fetch origin backend/verify-emailUser-idUser
git checkout -b backend/verify-emailUser-idUser origin/backend/verify-emailUser-idUser

# Opcional para establecer esa rama para futuros push
git branch --set-upstream-to=origin/backend/verify-emailUser-idUser

```

