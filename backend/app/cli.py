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


def register_cli(app):
    app.cli.add_command(media_cli)
