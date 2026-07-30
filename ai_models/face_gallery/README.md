# Face gallery

The Guardora backend automatically enrolls each approved banned-person photo
through the local AI service. The service stores a normalized image and a JSON
identity sidecar here so the face gallery survives service restarts.

Manual reference images are also supported: place one clear, front-facing
image here and use a simple filename such as `person-name.jpg`. Without a JSON
sidecar, the filename becomes the displayed identity.

Each image must contain exactly one face. Images are biometric personal data:
obtain explicit authorization, restrict access, define a retention period, and
never commit real reference images to source control.
