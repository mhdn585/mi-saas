import click
from flask.cli import with_appcontext


@click.group("media")
def media_cli():
    """Comandos de mantenimiento de archivos media."""


@media_cli.command("cleanup")
@click.option(
    "--grace-days",
    default=7,
    show_default=True,
    help="Días de gracia antes de borrar un asset huérfano.",
)
@with_appcontext
def cleanup_orphans(grace_days: int):
    """Borra archivos físicos de assets huérfanos tras el período de gracia."""
    from app.services import media_service

    result = media_service.cleanup_orphans(grace_days)
    click.echo(
        f"Huérfanos encontrados: {result['found']} — "
        f"archivos eliminados: {result['deleted']}."
    )


@click.group("user")
def user_cli():
    """Comandos de cuentas de usuario."""


@user_cli.command("create")
@click.argument("email")
@click.option("--name", prompt="Nombre", show_default=False)
@click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True)
@with_appcontext
def create_user(email: str, name: str, password: str):
    """Crea una cuenta directamente (sin pasar por la API)."""
    from app.services import auth_service

    user = auth_service.create_user(name, email, password)
    click.echo(f"Cuenta creada: {user.email} (id {user.id})")


@user_cli.command("claim-orphan-stores")
@click.argument("email")
@with_appcontext
def claim_orphan_stores(email: str):
    """Asigna las tiendas sin dueño (heredadas de la era pre-usuarios) a un usuario."""
    from app.extensions import db
    from app.models.store import Store
    from app.services import auth_service

    user = auth_service.find_by_email(email)
    if user is None:
        raise click.ClickException(f"No existe ninguna cuenta con {email}.")
    updated = (
        db.session.query(Store)
        .filter(Store.owner_id.is_(None))
        .update({Store.owner_id: user.id}, synchronize_session=False)
    )
    db.session.commit()
    click.echo(f"Tiendas sin dueño asignadas a {user.email}: {updated}.")


def register_cli(app):
    app.cli.add_command(media_cli)
    app.cli.add_command(user_cli)
